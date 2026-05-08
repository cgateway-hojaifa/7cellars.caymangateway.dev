import { DataTypes } from "sequelize";
import sequelize from "../helpers/sequelize";

const BlockedIP = sequelize.define(
  "BlockedIP",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "blocked_ips",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default BlockedIP;
