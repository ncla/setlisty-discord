function getEnvVariable(name: string): string {
    if (typeof process.env[name] === "undefined") {
        throw new Error(`Missing env variable ${name}!`);
    }
    return process.env[name]?.toString() ?? "";
}

export default {
    environment: getEnvVariable('ENVIRONMENT'),
    discord: {
        clientId: getEnvVariable('DISCORD_CLIENT_ID'),
        guildId: getEnvVariable('DISCORD_GUILD_ID'),
        token: getEnvVariable('DISCORD_SECRET_TOKEN')
    },
    setlistfm: {
        baseURL: getEnvVariable('SETLIST_FM_BASE_URL'),
        apiKey: getEnvVariable('SETLIST_FM_API_KEY')
    },
    musicbrainz: {
        baseURL: getEnvVariable('MUSICBRAINZ_BASE_URL'),
    },
    knex: {
        client: getEnvVariable('DB_CLIENT'),
        connection: {
            host: getEnvVariable('DB_HOST'),
            port: getEnvVariable('DB_PORT'),
            user: getEnvVariable('DB_USERNAME'),
            password: getEnvVariable('DB_PASSWORD'),
            database: getEnvVariable('DB_DATABASE')
        }
    },
}