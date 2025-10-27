const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'R-Gradani backend' });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});