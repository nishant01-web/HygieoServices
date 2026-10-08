import { useEffect, useState } from "react";
import "./App.css";

const workLists = {
  "Water Tank Cleaning": [
    "Tank inspection",
    "Sludge and dirt removal",
    "Internal tank cleaning",
    "Tank sanitization",
    "Final rinse and inspection",
  ],

  "Pest Control Management": [
    "Cockroach Control",
    "Ant Control",
    "Mosquito Control",
    "Fly Control",
    "Rat / Rodent Control",
    "Bed Bug Control",
    "Spider Control",
    "Termite Control",
    "Lizard Control",
    "Wasp & Insect Control",
    "Preventive Pest Treatment",
  ],

  "RO Maintenance & Repair": [
    "RO Inspection",
    "RO Installation",
    "Filter Replacement",
    "RO Service / General Maintenance",
  ],

  "Plus Services": [
    "Home Cleaning",
    "General Maintenance",
    "Hygiene Services",
    "Custom Service Requests",
  ],
};

const defaultTankPrices = {
  "500": 399,
  "1000": 499,
  "2000": 799,
  "5000": 1999,
};

function App() {
  const [servicePrices, setServicePrices] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(true);

  useEffect(() => {
    const loadServicePrices = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/prices");

        if (!response.ok) {
          throw new Error("Prices API failed");
        }

        const data = await response.json();
        setServicePrices(data);
      } catch (error) {
        console.error("Service prices loading error:", error);
      } finally {
        setPricesLoading(false);
      }
    };

    loadServicePrices();
  }, []);

  const getPrice = (serviceName, fallback = 0) => {
    const item = servicePrices.find(
      (price) => price.service_name === serviceName
    );

    return item ? Number(item.price) : fallback;
  };

  const pestServicePrices = Object.fromEntries(
    servicePrices
      .filter(
        (item) => item.category === "Pest Control Management"
      )
      .map((item) => [item.service_name, Number(item.price)])
  );

  const roServicePrices = Object.fromEntries(
    servicePrices
      .filter(
        (item) => item.category === "RO Maintenance & Repair"
      )
      .map((item) => [item.service_name, Number(item.price)])
  );

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    tankSize: "",
    multipleTanks: "no",
  });

  const [selectedServices, setSelectedServices] = useState([]);

  const [selectedPestServices, setSelectedPestServices] =
    useState([]);

  const [selectedROServices, setSelectedROServices] =
    useState([]);

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const toggleService = (service) => {
    setSelectedServices((current) => {
      if (current.includes(service)) {
        return current.filter((item) => item !== service);
      }

      return [...current, service];
    });

    if (
      service === "Pest Control Management" &&
      selectedServices.includes(service)
    ) {
      setSelectedPestServices([]);
    }

    if (
      service === "RO Maintenance & Repair" &&
      selectedServices.includes(service)
    ) {
      setSelectedROServices([]);
    }

    if (
      service === "Water Tank Cleaning" &&
      selectedServices.includes(service)
    ) {
      setForm((current) => ({
        ...current,
        tankSize: "",
        multipleTanks: "no",
      }));
    }
  };

  const togglePestService = (service) => {
    setSelectedPestServices((current) => {
      if (current.includes(service)) {
        return current.filter((item) => item !== service);
      }

      return [...current, service];
    });
  };

  const toggleROService = (service) => {
    setSelectedROServices((current) => {
      if (current.includes(service)) {
        return current.filter((item) => item !== service);
      }

      return [...current, service];
    });
  };

  const getTankPrice = () => {
    return getPrice(
      form.tankSize === "5000"
        ? "Cemented 5000 Ltr+"
        : `${form.tankSize} Ltr`,
      defaultTankPrices[form.tankSize] || 0
    );
  };

  const getPestTotal = () => {
    return selectedPestServices.reduce(
      (total, service) =>
        total + (pestServicePrices[service] || 0),
      0
    );
  };

  const getROTotal = () => {
    return selectedROServices.reduce(
      (total, service) =>
        total + (roServicePrices[service] || 0),
      0
    );
  };

  const getTotalPrice = () => {
    let total = 0;

    if (selectedServices.includes("Water Tank Cleaning")) {
      total += getTankPrice();
    }

    if (selectedServices.includes("Pest Control Management")) {
      total += getPestTotal();
    }

    if (selectedServices.includes("RO Maintenance & Repair")) {
      total += getROTotal();
    }

    if (
      selectedServices.includes("Water Tank Cleaning") &&
      form.multipleTanks === "yes"
    ) {
      total =
        total -
        Math.round(getTankPrice() * 0.1);
    }

    return total;
  };

  const totalPrice = getTotalPrice();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedServices.length === 0) {
      setMessage("Please select at least one service.");
      return;
    }

    if (
      selectedServices.includes("Water Tank Cleaning") &&
      !form.tankSize
    ) {
      setMessage("Please select tank capacity.");
      return;
    }

    if (
      selectedServices.includes("Pest Control Management") &&
      selectedPestServices.length === 0
    ) {
      setMessage(
        "Please select at least one Pest Control service."
      );
      return;
    }

    if (
      selectedServices.includes("RO Maintenance & Repair") &&
      selectedROServices.length === 0
    ) {
      setMessage(
        "Please select at least one RO service."
      );
      return;
    }

    setMessage("Booking submit ho rahi hai...");

    let serviceDetails = [];

    if (selectedServices.includes("Water Tank Cleaning")) {
      serviceDetails.push(
        `Water Tank Cleaning - ${form.tankSize} Ltr`
      );

      if (form.multipleTanks === "yes") {
        serviceDetails.push(
          "10% Multi-Tank Discount"
        );
      }
    }

    if (
      selectedServices.includes("Pest Control Management")
    ) {
      serviceDetails.push(
        `Pest Control: ${selectedPestServices.join(", ")}`
      );
    }

    if (
      selectedServices.includes("RO Maintenance & Repair")
    ) {
      serviceDetails.push(
        `RO Services: ${selectedROServices.join(", ")}`
      );
    }

    if (selectedServices.includes("Plus Services")) {
      serviceDetails.push(
        "Plus Services - Price on Request"
      );
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            service: serviceDetails.join(" + "),
            address: form.address,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage(
          `Booking successful! Your Booking ID is #${data.bookingId}`
        );

        setForm({
          name: "",
          phone: "",
          address: "",
          tankSize: "",
          multipleTanks: "no",
        });

        setSelectedServices([]);
        setSelectedPestServices([]);
        setSelectedROServices([]);
      } else {
        setMessage(
          data.message || "Booking failed"
        );
      }
    } catch (error) {
      setMessage(
        "Server se connection nahi ho pa raha. Backend check karein."
      );
    }
  };

  const getIcon = (service) => {
    if (service === "Water Tank Cleaning") return "💧";
    if (service === "Pest Control Management") return "🦟";
    if (service === "RO Maintenance & Repair") return "🔧";

    return "🛠️";
  };

  const getStartingPrice = (service) => {
    if (service === "Water Tank Cleaning") {
      const tankPrices = [
        getPrice("500 Ltr", defaultTankPrices["500"]),
        getPrice("1000 Ltr", defaultTankPrices["1000"]),
        getPrice("2000 Ltr", defaultTankPrices["2000"]),
        getPrice("Cemented 5000 Ltr+", defaultTankPrices["5000"]),
      ];

      return `Starting ₹${Math.min(...tankPrices)}`;
    }

    if (service === "Pest Control Management") {
      const values = Object.values(pestServicePrices);

      return values.length
        ? `Starting ₹${Math.min(...values)}`
        : "Starting ₹399";
    }

    if (service === "RO Maintenance & Repair") {
      const values = Object.values(roServicePrices);

      return values.length
        ? `Starting ₹${Math.min(...values)}`
        : "Starting ₹99";
    }

    return "Price on Request";
  };

  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">
        <div className="logo">
          <span className="logo-mark">H</span>

          <div>
            <strong>HYGIEO</strong>
            <small>SERVICES</small>
          </div>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#booking">Book Now</a>
        </div>
      </nav>

      {/* HERO */}

      <section className="hero" id="home">
        <div className="hero-content">

          <span className="hero-badge">
            CLEAN • HEALTHY • RELIABLE
          </span>

          <h1>
            Professional Cleaning &
            <span> Maintenance Services</span>
          </h1>

          <p>
            Hygieo Services provides reliable water
            tank cleaning, pest control, RO services
            and other hygiene services.
          </p>

          <a
            href="#booking"
            className="hero-btn"
          >
            Book a Service →
          </a>

        </div>
      </section>

      {/* SERVICES */}

      <section
        className="section"
        id="services"
      >

        <div className="section-title">
          <span>WHAT WE DO</span>

          <h2>Our Services</h2>

          <p>
            Select one or multiple services
            according to your needs.
          </p>
        </div>

        <div className="service-grid">

          {Object.entries(workLists).map(
            ([service, works]) => (

              <div
                className={`service-card ${
                  selectedServices.includes(service)
                    ? "service-selected"
                    : ""
                }`}
                key={service}
              >

                <div className="service-icon">
                  {getIcon(service)}
                </div>

                <h3>{service}</h3>

                <div className="service-price">
                  {getStartingPrice(service)}
                </div>

                <ul>

                  {works.slice(0, 6).map(
                    (work, index) => (

                      <li key={index}>
                        ✓ {work}
                      </li>

                    )
                  )}

                </ul>

                <button
                  type="button"
                  className={
                    selectedServices.includes(service)
                      ? "service-btn selected-btn"
                      : "service-btn"
                  }
                  onClick={() =>
                    toggleService(service)
                  }
                >
                  {selectedServices.includes(service)
                    ? "✓ Selected"
                    : "Select Service"}
                </button>

              </div>

            )
          )}

        </div>

      </section>

      {/* PRICING */}

      <section
        className="pricing-section"
        id="pricing"
      >

        <div className="section-title">

          <span>TRANSPARENT PRICING</span>

          <h2>Our Pricing</h2>

          <p>
            Simple and transparent pricing
            with no hidden charges.
          </p>

          {pricesLoading && (
            <small>
              Latest prices load ho rahi hain...
            </small>
          )}

        </div>

        <div className="pricing-grid">

          {/* WATER TANK */}

          <div className="price-card">

            <div className="price-icon">
              💧
            </div>

            <h3>
              Water Tank Cleaning
            </h3>

            <div className="price-row">
              <span>500 Ltr</span>
              <strong>₹{getPrice("500 Ltr", defaultTankPrices["500"])}</strong>
            </div>

            <div className="price-row">
              <span>1000 Ltr</span>
              <strong>₹{getPrice("1000 Ltr", defaultTankPrices["1000"])}</strong>
            </div>

            <div className="price-row">
              <span>2000 Ltr</span>
              <strong>₹{getPrice("2000 Ltr", defaultTankPrices["2000"])}</strong>
            </div>

            <div className="price-row">
              <span>Cemented 5000 Ltr+</span>
              <strong>₹{getPrice("Cemented 5000 Ltr+", defaultTankPrices["5000"])}+</strong>
            </div>

            <div className="discount-box">
              🏠 Same roof par 2 ya usse
              adhik tanks par
              <strong> 10% Discount</strong>
            </div>

          </div>

          {/* PEST */}

          <div className="price-card">

            <div className="price-icon">
              🦟
            </div>

            <h3>
              Pest Control Management
            </h3>

            <div className="starting-price">
              {getStartingPrice("Pest Control Management")}
              <small> starting</small>
            </div>

            <ul className="pricing-list">

              {Object.entries(
                pestServicePrices
              ).map(
                ([service, price]) => (

                  <li key={service}>
                    ✓ {service}
                    <strong>
                      ₹{price}
                    </strong>
                  </li>

                )
              )}

            </ul>

            <p>
              *Final price may vary according
              to pest type, area and infestation.
            </p>

          </div>

          {/* RO */}

          <div className="price-card">

            <div className="price-icon">
              🔧
            </div>

            <h3>
              RO Maintenance & Repair
            </h3>

            <div className="starting-price">
              {getStartingPrice("RO Maintenance & Repair")}
              <small> starting</small>
            </div>

            <ul className="pricing-list">

              {Object.entries(
                roServicePrices
              ).map(
                ([service, price]) => (

                  <li key={service}>
                    ✓ {service}
                    <strong>
                      ₹{price}
                    </strong>
                  </li>

                )
              )}

            </ul>

          </div>

          {/* PLUS */}

          <div className="price-card">

            <div className="price-icon">
              🛠️
            </div>

            <h3>
              Plus Services
            </h3>

            <div className="starting-price request">
              Price on Request
            </div>

            <ul className="pricing-list">

              <li>✓ Home Cleaning</li>
              <li>✓ General Maintenance</li>
              <li>✓ Hygiene Services</li>
              <li>✓ Custom Service Requests</li>

            </ul>

          </div>

        </div>

      </section>

      {/* WHY US */}

      <section className="why-section">

        <div className="section-title">

          <span>WHY CHOOSE US</span>

          <h2>
            Trusted Hygieo Services
          </h2>

        </div>

        <div className="why-grid">

          <div>✓ Professional Service</div>
          <div>✓ Transparent Pricing</div>
          <div>✓ Trained Workers</div>
          <div>✓ Reliable Support</div>

        </div>

      </section>

      {/* BOOKING */}

      <section
        className="booking-section"
        id="booking"
      >

        <div className="section-title">

          <span>
            MULTI-SERVICE BOOKING
          </span>

          <h2>
            Book Multiple Services Together
          </h2>

          <p>
            Select any services you need
            and book them in one request.
          </p>

        </div>

        <form
          className="booking-form"
          onSubmit={handleSubmit}
        >

          {/* NAME */}

          <div className="form-group">

            <label>
              Your Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
            />

          </div>

          {/* PHONE */}

          <div className="form-group">

            <label>
              Mobile Number
            </label>

            <input
              type="tel"
              name="phone"
              placeholder="Enter mobile number"
              value={form.phone}
              onChange={handleChange}
              required
            />

          </div>

          {/* SERVICE SELECT */}

          <div className="multi-service-box">

            <h3>
              Select Services
            </h3>

            <p>
              You can select more than one service.
            </p>

            <div className="service-checkbox-grid">

              {Object.keys(workLists).map(
                (service) => (

                  <label
                    className={`service-checkbox ${
                      selectedServices.includes(service)
                        ? "checked"
                        : ""
                    }`}
                    key={service}
                  >

                    <input
                      type="checkbox"
                      checked={selectedServices.includes(
                        service
                      )}
                      onChange={() =>
                        toggleService(service)
                      }
                    />

                    <span className="checkbox-icon">
                      {getIcon(service)}
                    </span>

                    <span>

                      <strong>
                        {service}
                      </strong>

                      <small>
                        {getStartingPrice(service)}
                      </small>

                    </span>

                  </label>

                )
              )}

            </div>

          </div>

          {/* WATER TANK OPTIONS */}

          {selectedServices.includes(
            "Water Tank Cleaning"
          ) && (

            <div className="tank-options">

              <div className="form-group">

                <label>
                  Tank Capacity
                </label>

                <select
                  name="tankSize"
                  value={form.tankSize}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select tank capacity
                  </option>

                  <option value="500">
                    500 Ltr — ₹{getPrice("500 Ltr", defaultTankPrices["500"])}
                  </option>

                  <option value="1000">
                    1000 Ltr — ₹{getPrice("1000 Ltr", defaultTankPrices["1000"])}
                  </option>

                  <option value="2000">
                    2000 Ltr — ₹{getPrice("2000 Ltr", defaultTankPrices["2000"])}
                  </option>

                  <option value="5000">
                    Cemented 5000 Ltr+ — ₹{getPrice("Cemented 5000 Ltr+", defaultTankPrices["5000"])}+
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label>
                  Same roof par 2 ya usse
                  adhik tanks?
                </label>

                <select
                  name="multipleTanks"
                  value={form.multipleTanks}
                  onChange={handleChange}
                >

                  <option value="no">
                    No
                  </option>

                  <option value="yes">
                    Yes — 10% Discount
                  </option>

                </select>

              </div>

            </div>

          )}

          {/* PEST OPTIONS */}

          {selectedServices.includes(
            "Pest Control Management"
          ) && (

            <div className="multi-service-box">

              <h3>
                🦟 Select Pest Control Services
              </h3>

              <p>
                Choose one or multiple pest services.
              </p>

              <div className="service-checkbox-grid">

                {Object.entries(
                  pestServicePrices
                ).map(
                  ([service, price]) => (

                    <label
                      className={`service-checkbox ${
                        selectedPestServices.includes(
                          service
                        )
                          ? "checked"
                          : ""
                      }`}
                      key={service}
                    >

                      <input
                        type="checkbox"
                        checked={selectedPestServices.includes(
                          service
                        )}
                        onChange={() =>
                          togglePestService(
                            service
                          )
                        }
                      />

                      <span className="checkbox-icon">
                        🦟
                      </span>

                      <span>

                        <strong>
                          {service}
                        </strong>

                        <small>
                          ₹{price}
                        </small>

                      </span>

                    </label>

                  )
                )}

              </div>

            </div>

          )}

          {/* RO OPTIONS */}

          {selectedServices.includes(
            "RO Maintenance & Repair"
          ) && (

            <div className="multi-service-box">

              <h3>
                🔧 Select RO Services
              </h3>

              <p>
                Choose one or multiple RO services.
              </p>

              <div className="service-checkbox-grid">

                {Object.entries(
                  roServicePrices
                ).map(
                  ([service, price]) => (

                    <label
                      className={`service-checkbox ${
                        selectedROServices.includes(
                          service
                        )
                          ? "checked"
                          : ""
                      }`}
                      key={service}
                    >

                      <input
                        type="checkbox"
                        checked={selectedROServices.includes(
                          service
                        )}
                        onChange={() =>
                          toggleROService(
                            service
                          )
                        }
                      />

                      <span className="checkbox-icon">
                        🔧
                      </span>

                      <span>

                        <strong>
                          {service}
                        </strong>

                        <small>
                          ₹{price}
                        </small>

                      </span>

                    </label>

                  )
                )}

              </div>

            </div>

          )}

          {/* SELECTED SERVICES */}

          {selectedServices.length > 0 && (

            <div className="selected-services-summary">

              <h3>
                Your Selected Services
              </h3>

              <div className="selected-service-tags">

                {selectedServices.map(
                  (service) => (

                    <div
                      className="selected-service-tag"
                      key={service}
                    >

                      <span>
                        {getIcon(service)}
                      </span>

                      {service}

                      <button
                        type="button"
                        onClick={() =>
                          toggleService(service)
                        }
                      >
                        ×
                      </button>

                    </div>

                  )
                )}

              </div>

            </div>

          )}

          {/* TOTAL */}

          {selectedServices.length > 0 && (

            <div className="selected-price">

              <span>
                Estimated Total
              </span>

              {totalPrice > 0 ? (

                <strong>
                  ₹{totalPrice}
                </strong>

              ) : (

                <strong>
                  Price on Request
                </strong>

              )}

              {selectedServices.includes(
                "Plus Services"
              ) && (

                <small>
                  Plus Services price will be
                  confirmed after inspection/request.
                </small>

              )}

              {selectedServices.includes(
                "Water Tank Cleaning"
              ) &&
                form.multipleTanks === "yes" && (

                  <small>
                    ✓ 10% multi-tank discount applied
                  </small>

                )}

            </div>

          )}

          {/* WORK INCLUDED */}

          {selectedServices.length > 0 && (

            <div className="selected-work">

              <h3>
                Selected Work / Services
              </h3>

              {selectedServices.map(
                (service) => (

                  <div
                    className="work-service-group"
                    key={service}
                  >

                    <h4>
                      {getIcon(service)} {service}
                    </h4>

                    <ul>

                      {workLists[service].map(
                        (work, index) => (

                          <li key={index}>
                            ✓ {work}
                          </li>

                        )
                      )}

                    </ul>

                  </div>

                )
              )}

            </div>

          )}

          {/* ADDRESS */}

          <div className="form-group">

            <label>
              Service Address
            </label>

            <textarea
              name="address"
              placeholder="Enter complete service address"
              value={form.address}
              onChange={handleChange}
              required
            ></textarea>

          </div>

          {/* BUTTON */}

          <button
            className="booking-btn"
            type="submit"
          >
            Book All Selected Services →
          </button>

          {/* MESSAGE */}

          {message && (

            <div className="booking-message">
              {message}
            </div>

          )}

        </form>

      </section>

      {/* FOOTER */}

      <footer className="footer">

        <div>

          <strong>
            HYGIEO SERVICES
          </strong>

          <p>
            Clean Homes | Healthy Lives
          </p>

        </div>

        <p>
          © 2026 Hygieo Services.
          All rights reserved.
        </p>

      </footer>

    </div>
  );
}

export default App;