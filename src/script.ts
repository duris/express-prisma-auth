import express, { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

app.get("/", async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.send(users);
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
    .then(() => res.status(200).send(`Thanks for signing up, ${name}!`)) //TODO: Send Welcome Email
    .catch((err) => res.status(400).json("Unable to register"));
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
      // TODO :
      // Cookies +
      // JWT

      // Create Token
      const token = jwt.sign(user, process.env.PRIVATE_KEY);
      console.log(token);

      res.status(200).send(`Welcome back, ${user.name}!`);
    } else {
      res.status(400).send("Cannot login with username/password");
    }
  } else {
    res.status(400).send("Cannot login with username/password");
  }
});

app.post("/email", async (req: Request, res: Response) => {
  const { email, subject, text } = req.body;
  const mailData = {
    from: process.env.EMAIL_ADDRESS,
    to: email,
    subject: subject,
    text: text,
    html: `<b>Welcome ${email}! This is your dashboard.</b>
             <br>Feel free to customize the look!<br/>`,
  };

  const transporter = nodemailer.createTransport({
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_KEY,
    },
    secure: true,
  });

  await transporter.sendMail(mailData, (error: Error) => {
    if (error) {
      return console.log(error);
    }

    res.status(200).send("Mail sent!");
  });
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
