import { DataTypes } from "sequelize";
import sequelize from "../helpers/sequelize";

const ErrorLog = sequelize.define(
  "ErrorLog",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: "error_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default ErrorLog;
