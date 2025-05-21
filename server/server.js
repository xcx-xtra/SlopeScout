const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/test", (req, res) => res.send("API up"));

app.listen(3001, () => console.log("Server running on 3001"));
