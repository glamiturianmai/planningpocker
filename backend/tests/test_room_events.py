"""Room commands and broadcasts, without connecting to a database."""
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import WebSocketDisconnect
from app.routers import rooms


class VoteTests(unittest.TestCase):
    def setUp(self):
        self.db = MagicMock()
        self.player = SimpleNamespace(vote=None)
        self.db.query.return_value.filter_by.return_value.first.return_value = self.player
        self.room_id = uuid4()
        self.user_id = str(uuid4())

    def test_custom_and_zero_votes_are_saved(self):
        for value in (0, 21, 144, rooms.MAX_VOTE):
            rooms.apply_room_command(self.db, self.room_id, {"user_id": self.user_id, "vote": value})
            self.assertEqual(self.player.vote, value)
        self.assertEqual(self.db.commit.call_count, 4)

    def test_invalid_custom_votes_are_rejected_before_database_write(self):
        for value in (-1, 2.5, True, "21", None, rooms.MAX_VOTE + 1):
            with self.subTest(value=value), self.assertRaises(ValueError):
                rooms.apply_room_command(self.db, self.room_id, {"user_id": self.user_id, "vote": value})
        self.db.commit.assert_not_called()

    def test_removal_only_deletes_room_membership(self):
        rooms.apply_room_command(self.db, self.room_id, {"leave": True, "user_id": self.user_id})
        self.db.query.return_value.filter_by.assert_called_once_with(room_id=self.room_id, user_id=rooms.UUID(self.user_id))
        self.db.delete.assert_called_once_with(self.player)
        self.db.commit.assert_called_once()

    def test_removing_absent_member_is_idempotent(self):
        self.db.query.return_value.filter_by.return_value.first.return_value = None
        rooms.apply_room_command(self.db, self.room_id, {"leave": True, "user_id": self.user_id})
        self.db.delete.assert_not_called()

    def test_existing_member_can_join_again_without_duplicate(self):
        rooms.join_room(self.room_id, SimpleNamespace(user_id=self.user_id, name="Анна"), self.db)
        self.db.add.assert_not_called()

    def test_removed_member_can_rejoin(self):
        self.db.query.return_value.filter_by.return_value.first.side_effect = [SimpleNamespace(), None]
        rooms.join_room(self.room_id, SimpleNamespace(user_id=self.user_id, name="Анна"), self.db)
        member = self.db.add.call_args.args[0]
        self.assertEqual(member.room_id, self.room_id)
        self.assertEqual(member.user_id, self.user_id)
        self.db.commit.assert_called_once()


class WebSocketTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        rooms.room_connections.clear()
        self.room_id = uuid4()
        self.user_id = str(uuid4())
        self.target_id = str(uuid4())
        self.snapshot = {"id": str(self.room_id), "players": [{"user_id": self.user_id}, {"user_id": self.target_id}]}
        self.socket = AsyncMock()
        self.peer = AsyncMock()
        rooms.room_connections[str(self.room_id)].append(self.peer)
        self.db = MagicMock()
        self.session = MagicMock()
        self.session.return_value.__enter__.return_value = self.db

    async def test_new_connection_broadcasts_current_members_to_existing_clients(self):
        self.socket.receive_json.side_effect = WebSocketDisconnect()
        with patch.object(rooms, "SessionLocal", self.session), patch.object(rooms, "room_snapshot", return_value=self.snapshot):
            await rooms.websocket_room(self.socket, self.room_id)
        self.peer.send_json.assert_awaited_once_with(self.snapshot)
        self.assertNotIn(self.socket, rooms.room_connections[str(self.room_id)])

    async def test_removed_member_receives_updated_membership(self):
        remaining = {**self.snapshot, "players": [{"user_id": self.user_id}]}
        self.socket.receive_json.side_effect = [{"leave": True, "user_id": self.target_id}, WebSocketDisconnect()]
        with patch.object(rooms, "SessionLocal", self.session), patch.object(rooms, "room_snapshot", side_effect=[self.snapshot, remaining]):
            await rooms.websocket_room(self.socket, self.room_id)
        self.peer.send_json.assert_awaited_with(remaining)
        self.socket.send_json.assert_awaited_with(remaining)
        self.assertEqual(self.session.call_count, 2)

    async def test_targeted_reaction_is_broadcast_without_database_write(self):
        self.socket.receive_json.side_effect = [{"reaction": "✈️", "user_id": self.user_id, "target_user_id": self.target_id}, WebSocketDisconnect()]
        with patch.object(rooms, "SessionLocal", self.session), patch.object(rooms, "room_snapshot", return_value=self.snapshot):
            await rooms.websocket_room(self.socket, self.room_id)
        self.peer.send_json.assert_awaited_with({"side": "left", "style": "throw", "type": "reaction", "emoji": "✈️", "user_id": self.user_id, "target_user_id": self.target_id})
        self.db.commit.assert_not_called()

    def test_legacy_clients_always_receive_throw_style(self):
        for style in ("scene", "throw", "sticker"):
            with self.subTest(style=style), patch.object(rooms, "room_snapshot", return_value=self.snapshot):
                event = rooms.execute_room_message(self.db, self.room_id, {"reaction": "🐸", "user_id": self.user_id, "target_user_id": self.target_id, "style": style})
                self.assertEqual(event["style"], "throw")
        self.db.commit.assert_not_called()

    def test_all_five_reactions_are_supported(self):
        for emoji in ("🐸", "🐱", "✈️", "❤️", "📄"):
            with self.subTest(emoji=emoji), patch.object(rooms, "room_snapshot", return_value=self.snapshot):
                event = rooms.execute_room_message(self.db, self.room_id, {"reaction": emoji, "user_id": self.user_id})
                self.assertEqual(event["emoji"], emoji)
                self.assertEqual(event["style"], "throw")
        self.db.commit.assert_not_called()

    def test_unicode_reactions_include_flags_skin_tones_and_zwj(self):
        for emoji in ("🚀", "😂", "👍🏽", "👩‍💻", "🇪🇪", "1️⃣", "👨‍👩‍👧‍👦", "⭐️", "👍️"):
            with self.subTest(emoji=emoji), patch.object(rooms, "room_snapshot", return_value=self.snapshot):
                event = rooms.execute_room_message(self.db, self.room_id, {"reaction": emoji, "user_id": self.user_id, "target_user_id": self.target_id})
                self.assertEqual(event["emoji"], emoji)
                self.assertEqual(event["target_user_id"], self.target_id)
        self.db.commit.assert_not_called()

    def test_non_emoji_reactions_are_rejected(self):
        for reaction in ("", "text", "😀😀", None, [], 1):
            with self.subTest(reaction=reaction), patch.object(rooms, "room_snapshot", return_value=self.snapshot):
                with self.assertRaises(ValueError):
                    rooms.execute_room_message(self.db, self.room_id, {"reaction": reaction, "user_id": self.user_id})

    def test_throw_side_is_preserved(self):
        for side in ("left", "right"):
            with patch.object(rooms, "room_snapshot", return_value=self.snapshot):
                event = rooms.execute_room_message(self.db, self.room_id, {"reaction": "✈️", "user_id": self.user_id, "side": side})
                self.assertEqual(event["side"], side)

    async def test_invalid_reaction_does_not_interrupt_next_valid_vote(self):
        self.socket.receive_json.side_effect = [{"reaction": "bad", "user_id": self.user_id}, {"vote": 21, "user_id": self.user_id}, WebSocketDisconnect()]
        with patch.object(rooms, "SessionLocal", self.session), patch.object(rooms, "room_snapshot", return_value=self.snapshot):
            await rooms.websocket_room(self.socket, self.room_id)
        self.assertTrue(any(call.args[0].get("type") == "error" for call in self.socket.send_json.call_args_list))
        self.db.commit.assert_called_once()
        self.assertEqual(self.db.query.return_value.filter_by.return_value.first.return_value.vote, 21)

    async def test_broken_connection_does_not_prevent_other_clients_receiving_event(self):
        self.peer.send_json.side_effect = RuntimeError("connection closed")
        healthy = AsyncMock()
        rooms.room_connections[str(self.room_id)].append(healthy)
        await rooms.broadcast_room(str(self.room_id), self.snapshot)
        healthy.send_json.assert_awaited_once_with(self.snapshot)
        self.assertNotIn(self.peer, rooms.room_connections[str(self.room_id)])


if __name__ == "__main__":
    unittest.main()
