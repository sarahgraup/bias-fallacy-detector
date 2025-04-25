import dotenv from "dotenv";

dotenv.config();

interface Config {
  PORT: number;
}

const PORT = Number(process.env.PORT) || 3001;

const config: Config = {

  PORT,
};

export default config;
