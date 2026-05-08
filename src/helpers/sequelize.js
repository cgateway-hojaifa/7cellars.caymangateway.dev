import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  benchmark: true,
  dialect: "mysql",
  logging: false,
  dialectModule: require("mysql2"),
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DATABASE CONNECTION SUCCESSFUL");

    await sequelize.sync({ alter: true });
    console.log("sync successful");
  } catch (error) {
    console.log("eror code: 101: ", error);
  }
})();

export default sequelize;
