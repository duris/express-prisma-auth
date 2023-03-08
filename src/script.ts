import express, { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

app.get("/", async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.send("hello world");
});

app.post("/signup", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 13);
  const user = await prisma.user
    .create({
      data: {
        name: name,
        email: email,
        password: hash,
      },
    })
    .then(() => res.status(200).send(`Thanks for signing up, ${name}!`))
    .catch((err) => res.status(400).json("Email exist already"));
});

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const users = (await prisma.user.findMany()).filter(
    (user) => user.email === email
  );

  if (users[0] != null) {
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      // Set Session:
      // Cookie
      // JWT
      const token = jwt.sign(user, "shhhhh");
      console.log(token);
      res.status(200).send(`Welcome back, ${user.name}!`);
    } else {
      res.status(400).send("Cannot login with username/password");
    }
  } else {
    res.status(400).send("Cannot login with username/password");
  }
});

async function main() {
  console.log("main func");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

app.listen(8080);
