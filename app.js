const express = require('express');
const mysql = require('mysql');

const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3050;

const app = express();

app.get('/', (req, res) => {
  res.sendFile('./public/index.html', { root: __dirname });
});

app.get('/product/:id', (req, res) => {
  res.sendFile('./public/product.html', { root: __dirname });
});

app.use(bodyParser.json());

// MySql
const connection = mysql.createPool({
  host: 'us-cdbr-east-03.cleardb.com',
  user: 'b63e1ea78cd984',
  password: 'bfc1e6b0',
  database: 'heroku_fb7aceefffc92df'
});

connection.queryPromise = (sql) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, result) => {
      if (err) { reject(new Error()); }
      else { resolve(result); }
    });
  });
}

// all products
app.get('/core_products', (req, res) => {
  const sql = 'SELECT * FROM core_products';

  connection.query(sql, (error, results) => {
    if (error) throw error;
    if (results.length > 0) {
      res.json(results);
    } else {
      res.send('Not result');
    }
  });
});


app.get('/locations', (req, res) => {
  const sql = 'SELECT * FROM locations';

  connection.query(sql, (error, results) => {
    if (error) throw error;
    if (results.length > 0) {
      res.json(results);
    } else {
      res.send('Not result');
    }
  });
});


app.get('/core_products/:id', (req, res) => {
  const { id } = req.params;

  let product;

  connection.queryPromise(`SELECT * FROM core_products WHERE id = ${id}`)
    .then((result) => {
      product = result[0];
      var sql = `SELECT locations.* FROM core_products INNER JOIN locations ON locations.product_code=core_products.core_number WHERE id=${id}`;
      return connection.queryPromise(sql);
    }).then((result) => {
      product['locations'] = result;

      var sql = `SELECT locations.warehouse, SUM(locations.quantity) as 'total_quantity' FROM core_products INNER JOIN locations ON locations.product_code=core_products.core_number WHERE id=${id} GROUP BY locations.warehouse`;
      return connection.queryPromise(sql);
    }).then((result) => {
      product['quantity_by_warehouse'] = result;

      res.json(product);
    }).catch((err) => {
      console.log(err);
      res.json(err);
    });
});

app.post('/locations/update', (req, res) => {
  const { warehouse, location, product_code, quantity } = req.body;

  connection.queryPromise(`UPDATE locations SET quantity = quantity + ${quantity} WHERE warehouse = '${warehouse}' AND location = '${location}' AND product_code = '${product_code}'`)
    .then((result) => {
      res.json({
        'status': 'success'
      });
    }).catch((err) => {
      console.log(err);
      res.json({
        'status': 'error',
        'error': err
      });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
