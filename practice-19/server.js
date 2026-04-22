const { Sequelize, DataTypes } = require("sequelize");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME || "userdb",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
  },
);

sequelize
  .authenticate()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Connection error:", err));

const User = sequelize.define(
  "User",
  {
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    timestamps: true,
  },
);

sequelize.sync({ force: false });

app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.send(users);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user) return res.status(404).send({ message: "User not found" });
    res.send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.patch("/api/users/:id", async (req, res) => {
  try {
    const [updatedCount, updatedUsers] = await User.update(req.body, {
      where: { id: req.params.id },
      returning: true,
    });
    if (updatedCount === 0) return res.status(404).send({ message: "User not found" });
    res.send(updatedUsers[0]);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const deletedCount = await User.destroy({ where: { id: req.params.id } });
    if (deletedCount === 0) return res.status(404).send({ message: "User not found" });
    res.send({ message: "User deleted" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});