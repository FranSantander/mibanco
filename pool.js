//LLamado a las dependencias (hay que instalar ambas)
const { Pool } = require("pg");
const Cursor = require("pg-cursor");

//configuracion del usuario y la pool
const config = {
  user: "postgres",
  host: "127.0.0.1",
  password: "postgresql",
  database: "banco",
  port: 5432,
  max: 20,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(config);

//Argumentos obtenidos desde la consola
const argumentos = process.argv.slice(2);
const funcion = argumentos[0];
const id = argumentos[1];
const monto = argumentos[2];
const descripcion = argumentos[3];
const fecha = argumentos[4];

//Pool de conexiones a la base de datos 'banco'
pool.connect(async (error_conexion, client, release) => {
  //Obtencion de errores de conexion
  if (error_conexion) return console.error(error_conexion.code);

  //Requirimiento 1
  if (funcion == "resta") {
    const transaccionResta = async (id, monto, descripcion, fecha, client) => {
      try {
        await client.query("BEGIN");
        const resta = `UPDATE cuentas SET saldo = saldo - ${monto} WHERE id = ${id} RETURNING *;`;
        await client.query(resta);
        const transaccion = `INSERT into transacciones (descripcion,fecha,monto,cuenta) VALUES ('${descripcion}','${fecha}',${monto},${id}) RETURNING *;`;
        await client.query(transaccion);
        const result = await client.query(transaccion);
        console.log(result.rows[0]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        console.log("Error código: " + error.code);
        console.log("Detalle del error: " + error.detail);
        console.log("Tabla originaria del error: " + error.table);
        console.log("Restricción violada en el campo: " + error.constraint);
      }
    };
    await transaccionResta(id, monto, descripcion, fecha, client);
    release();
  }

  //Requerimiento 2
  if (funcion == "consulta10") {
    const consulta10 = async (id, client) => {
      try {
        const consulta = new Cursor(
          `SELECT * FROM transacciones WHERE cuenta = ${id};`
        );
        const cursor = await client.query(consulta);
        cursor.read(10, (err, rows) => {
          if (err){
            console.log(err.code)
            release()
            return err
          }
          console.log(rows);
          cursor.close();
          release();
        });
      } catch (err) {
        console.log(err.code);
      }
    };

    consulta10(id, client);
  }

  //Requisito 3
  if (funcion == "saldo") {
    const saldo = async (id, client) => {
      try {
        const consulta = new Cursor(`SELECT * FROM cuentas WHERE id = ${id}`);
        const cursor = await client.query(consulta);
        cursor.read(1, (err, rows) => {
          if (err){
            console.log(err)
            release()
            return err
          }
          console.log(rows[0]);
          cursor.close();
          release();
        });
      } catch (err) {
        console.log(err.code);
        return err
      }
    };

    await saldo(id, client);
  }

  pool.end();
});
