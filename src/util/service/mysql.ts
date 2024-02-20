import mysql from 'mysql2';
import ls from '../ls.js';

export default () => {
  const connection = mysql.createConnection({
    ...ls.get('service.mysql'),
    database: 'dkd'
  });
  connection.connect();
  return connection;
};
