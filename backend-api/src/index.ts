export {};
const { createServer } = require('./server');

const PORT = Number(process.env.PORT || 4001);

createServer()
  .then(({ server }: any) => {
    server.listen(PORT, () => console.log(`Backend API listening on http://localhost:${PORT}`));
  })
  .catch((err: any) => {
    console.error(err);
    process.exit(1);
  });


