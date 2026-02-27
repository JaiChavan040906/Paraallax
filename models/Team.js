import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ["inactive", "waiting", "playing", "success", "caught"],
      default: "inactive",
    },
    activeRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    assignedPuzzleIds: [{ type: String }],
    currentIndex: { type: Number, default: 0 },
    solvedPuzzleIds: [{ type: String }],
    penaltySeconds: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
    finishTime: { type: Date, default: null },
    gameStartTime: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
