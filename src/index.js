import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

try {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running at port: ${process.env.PORT} `);
  });
} catch (err) {
  console.log("Server Error!");
}
