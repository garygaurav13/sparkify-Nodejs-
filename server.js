const express = require("express"); // express framework
const cors = require("cors"); //cross origin

const http = require("http");

const socketIo = require("socket.io");

const app = express(); // express object passed into app

const corsOptions = require("./constant/cors"); // Import the cors options
app.use(cors(corsOptions)); // Use the cors middleware

const server = http.createServer(app);

const io = socketIo(server, {
  cors: corsOptions, // Pass corsOptions directly to socket.io
});

require("dotenv").config(); //  env change

require("./constant/config"); // config change

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to express application" });
});

// set port, listen for requests
const PORT = process.env.PORT || 9090;

// Start the server
const db = require("./database/db");
db.sequelize_connect
  .sync({ alter: true })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("Error syncing models:", err));

// calling user routes
require("./routes/user.routes")(app);

// calling profile routes
require("./routes/profile.routes")(app);

// calling sparks routes
require("./routes/spark.routes")(app);

//calling blocked profile routes
require("./routes/blocked.routes")(app);

//calling favourite profile routes
require("./routes/favourites.routes")(app);

//calling user sparks route
require("./routes/user_spark.routes")(app);

// calling chat routes
require("./routes/chat.routes")(app);

//calling reports
require("./routes/report.routes")(app);

//faq routes end points
require("./routes/faq.routes")(app);

//settings end points
require("./routes/setting.routes")(app);

//appsettings endpoints
require("./routes/appsetting.routes")(app);

//static pages
require("./routes/staticpage.routes")(app);
// on socket connection
io.on("connection", (socket) => {
  socket.on("join_room", ({ user_id, room_id }) => {
    socket.join(room_id);
    io.to(room_id).emit("connected", { user_id, room_id });
  });

  socket.on("join_rooms", ({ user_id, roomsIds }) => {
    socket.join(roomsIds);
    // io.to(room_id).emit("connected", {user_id,room_id});
  });

  socket.on("new_message", (newMessage) => {
    const { message_id, sender_id, room_id, message } = newMessage;
    if (message_id && sender_id && room_id && message) {
      io.to(room_id).emit("message_received", newMessage);
      // io.in(room_id).emit("message_received", { newMessage });
      // socket.to(room_id).emit("message_received", newMessage);
    } else {
      return;
    }
  });

  socket.on("delete_msg", (data) => {
    const { room_id } = data;
    io.to(room_id).emit("delete_this_msg", { room_id, ...data });
  });
  socket.on("typing", ({ room_id, user_id }) => {
    io.to(room_id).emit("user_typing", { room_id, user_id });
  });

  socket.on("typing_stop", ({ room_id, user_id }) => {
    io.to(room_id).emit("user_stopped_typing", { room_id, user_id });
  });

  socket.on("leave_room", (room_id) => {
    socket.leave(room_id);
  });
});
