const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const db = new Database("hygieo.db");

/* =========================
   BOOKINGS TABLE
========================= */

db.prepare(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    worker_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/* =========================
   DATABASE MIGRATION
========================= */

const bookingColumns = db
  .prepare(`PRAGMA table_info(bookings)`)
  .all();

const hasWorkerId = bookingColumns.some(
  (column) => column.name === "worker_id"
);

if (!hasWorkerId) {
  db.prepare(`
    ALTER TABLE bookings
    ADD COLUMN worker_id INTEGER
  `).run();
}

/* =========================
   SERVICE PRICES
========================= */

db.prepare(`
  CREATE TABLE IF NOT EXISTS service_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    service_name TEXT NOT NULL UNIQUE,
    price INTEGER NOT NULL DEFAULT 0
  )
`).run();

const defaultPrices = [
  {
    category: "Water Tank Cleaning",
    service_name: "500 Ltr",
    price: 399
  },
  {
    category: "Water Tank Cleaning",
    service_name: "1000 Ltr",
    price: 499
  },
  {
    category: "Water Tank Cleaning",
    service_name: "2000 Ltr",
    price: 799
  },
  {
    category: "Water Tank Cleaning",
    service_name: "Cemented 5000 Ltr+",
    price: 1999
  },

  {
    category: "Pest Control Management",
    service_name: "Cockroach Control",
    price: 499
  },
  {
    category: "Pest Control Management",
    service_name: "Ant Control",
    price: 499
  },
  {
    category: "Pest Control Management",
    service_name: "Mosquito Control",
    price: 499
  },
  {
    category: "Pest Control Management",
    service_name: "Fly Control",
    price: 499
  },
  {
    category: "Pest Control Management",
    service_name: "Rat / Rodent Control",
    price: 599
  },
  {
    category: "Pest Control Management",
    service_name: "Bed Bug Control",
    price: 799
  },
  {
    category: "Pest Control Management",
    service_name: "Spider Control",
    price: 399
  },
  {
    category: "Pest Control Management",
    service_name: "Termite Control",
    price: 999
  },
  {
    category: "Pest Control Management",
    service_name: "Lizard Control",
    price: 399
  },
  {
    category: "Pest Control Management",
    service_name: "Wasp & Insect Control",
    price: 499
  },
  {
    category: "Pest Control Management",
    service_name: "Preventive Pest Treatment",
    price: 499
  },

  {
    category: "RO Maintenance & Repair",
    service_name: "RO Inspection",
    price: 99
  },
  {
    category: "RO Maintenance & Repair",
    service_name: "RO Installation",
    price: 299
  },
  {
    category: "RO Maintenance & Repair",
    service_name: "Filter Replacement",
    price: 299
  },
  {
    category: "RO Maintenance & Repair",
    service_name: "RO Service / General Maintenance",
    price: 199
  }
];

const insertPrice = db.prepare(`
  INSERT OR IGNORE INTO service_prices
  (category, service_name, price)
  VALUES (?, ?, ?)
`);

for (const item of defaultPrices) {
  insertPrice.run(
    item.category,
    item.service_name,
    item.price
  );
}

/* =========================
   WORKERS TABLE
========================= */

db.prepare(`
  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    skill TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "Hygieo Services API is running"
  });
});

/* =========================
   CREATE BOOKING
========================= */

app.post("/api/bookings", (req, res) => {
  const {
    name,
    phone,
    service,
    address
  } = req.body;

  if (!name || !phone || !service || !address) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  const result = db.prepare(`
    INSERT INTO bookings
    (name, phone, service, address)
    VALUES (?, ?, ?, ?)
  `).run(
    name,
    phone,
    service,
    address
  );

  res.status(201).json({
    success: true,
    message: "Booking request received",
    bookingId: result.lastInsertRowid
  });
});

/* =========================
   GET BOOKINGS
========================= */

app.get("/api/bookings", (req, res) => {
  const bookings = db.prepare(`
    SELECT
      bookings.*,
      workers.name AS worker_name,
      workers.phone AS worker_phone,
      workers.skill AS worker_skill
    FROM bookings
    LEFT JOIN workers
      ON bookings.worker_id = workers.id
    ORDER BY bookings.id DESC
  `).all();

  res.json(bookings);
});

/* =========================
   UPDATE BOOKING STATUS
========================= */

app.patch("/api/bookings/:id/status", (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Declined",
    "Worker Assigned",
    "On The Way",
    "Service Started",
    "Completed"
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status"
    });
  }

  const result = db.prepare(`
    UPDATE bookings
    SET status = ?
    WHERE id = ?
  `).run(
    status,
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  res.json({
    success: true,
    message: "Booking status updated"
  });
});

/* =========================
   ASSIGN WORKER TO BOOKING
========================= */

app.patch("/api/bookings/:id/worker", (req, res) => {
  const bookingId = Number(req.params.id);
  const workerId = Number(req.body.workerId);

  if (!Number.isInteger(bookingId) || !Number.isInteger(workerId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking or worker ID"
    });
  }

  const booking = db.prepare(`
    SELECT *
    FROM bookings
    WHERE id = ?
  `).get(bookingId);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  const worker = db.prepare(`
    SELECT *
    FROM workers
    WHERE id = ?
  `).get(workerId);

  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "Worker not found"
    });
  }

  if (worker.status !== "Active") {
    return res.status(400).json({
      success: false,
      message: "Worker is not active"
    });
  }

  db.prepare(`
    UPDATE bookings
    SET
      worker_id = ?,
      status = 'Worker Assigned'
    WHERE id = ?
  `).run(
    workerId,
    bookingId
  );

  res.json({
    success: true,
    message: "Worker assigned successfully",
    bookingId,
    workerId
  });
});

/* =========================
   REMOVE WORKER FROM BOOKING
========================= */

app.delete("/api/bookings/:id/worker", (req, res) => {
  const bookingId = Number(req.params.id);

  const result = db.prepare(`
    UPDATE bookings
    SET
      worker_id = NULL,
      status = 'Confirmed'
    WHERE id = ?
  `).run(bookingId);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  res.json({
    success: true,
    message: "Worker removed from booking"
  });
});

/* =========================
   PRICES
========================= */

app.get("/api/prices", (req, res) => {
  const prices = db.prepare(`
    SELECT *
    FROM service_prices
    ORDER BY category, id
  `).all();

  res.json(prices);
});

/* =========================
   UPDATE PRICE
========================= */

app.patch("/api/prices/:id", (req, res) => {
  const { price } = req.body;
  const newPrice = Number(price);

  if (!Number.isFinite(newPrice) || newPrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid price"
    });
  }

  const result = db.prepare(`
    UPDATE service_prices
    SET price = ?
    WHERE id = ?
  `).run(
    Math.round(newPrice),
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: "Price not found"
    });
  }

  res.json({
    success: true,
    message: "Price updated successfully"
  });
});

/* =========================
   GET WORKERS
========================= */

app.get("/api/workers", (req, res) => {
  const workers = db.prepare(`
    SELECT *
    FROM workers
    ORDER BY id DESC
  `).all();

  res.json(workers);
});

/* =========================
   ADD WORKER
========================= */

app.post("/api/workers", (req, res) => {
  const {
    name,
    phone,
    skill
  } = req.body;

  if (!name || !phone || !skill) {
    return res.status(400).json({
      success: false,
      message: "Name, phone and skill are required"
    });
  }

  const result = db.prepare(`
    INSERT INTO workers
    (name, phone, skill, status)
    VALUES (?, ?, ?, 'Active')
  `).run(
    name.trim(),
    phone.trim(),
    skill.trim()
  );

  res.status(201).json({
    success: true,
    message: "Worker added successfully",
    workerId: result.lastInsertRowid
  });
});

/* =========================
   WORKER STATUS
========================= */

app.patch("/api/workers/:id/status", (req, res) => {
  const { status } = req.body;

  if (
    status !== "Active" &&
    status !== "Inactive"
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid worker status"
    });
  }

  const result = db.prepare(`
    UPDATE workers
    SET status = ?
    WHERE id = ?
  `).run(
    status,
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: "Worker not found"
    });
  }

  res.json({
    success: true,
    message: "Worker status updated"
  });
});

/* =========================
   DELETE WORKER
========================= */

app.delete("/api/workers/:id", (req, res) => {
  const workerId = Number(req.params.id);

  const assignedBookings = db.prepare(`
    SELECT COUNT(*) AS count
    FROM bookings
    WHERE worker_id = ?
  `).get(workerId);

  if (assignedBookings.count > 0) {
    return res.status(400).json({
      success: false,
      message:
        "This worker is assigned to a booking. Remove the worker from the booking first."
    });
  }

  const result = db.prepare(`
    DELETE FROM workers
    WHERE id = ?
  `).run(workerId);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: "Worker not found"
    });
  }

  res.json({
    success: true,
    message: "Worker deleted successfully"
  });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `Hygieo backend running at http://localhost:${PORT}`
  );
});