module.exports = {
  development: {
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      port : 3306,
      user : 'root',
      password : 'changeme123rootPLS',
      database : 'setlisty'
    }
  },
  production: {
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      port : 3306,
      user : 'root',
      password : 'changeme123rootPLS',
      database : 'setlisty'
    }
  }
};
