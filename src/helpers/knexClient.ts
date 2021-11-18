import knex from "knex";
import config from "../config"

const knexClient = knex(config.knex);

export default knexClient

export const now = knexClient.raw('NOW()')