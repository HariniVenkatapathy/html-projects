const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());


function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}


app.post('/admissions', (req, res) => {
  const data = req.body;
  console.log("📥 Incoming data:", data);

  const requiredFields = ['name', 'dob', 'age', 'yearly_income', 'phone_number'];
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return res.status(400).json({ error: ` '${field}' is required.` });
    }
  }

  const dobDate = new Date(data.dob);
  const today = new Date();
  if (dobDate > today) {
    return res.status(400).json({ error: " Date of Birth cannot be in the future." });
  }

  const calculatedAge = calculateAge(data.dob);
  if (calculatedAge !== parseInt(data.age)) {
    return res.status(400).json({ error: " Age doesn't match Date of Birth." });
  }
  if (calculatedAge < 5 || calculatedAge > 18) {
    return res.status(400).json({ error: " Age must be between 5 and 18 years to enroll." });
  }

  const phone = data.phone_number.toString().replace(/\D/g, '');
  if (phone.length !== 10) {
    return res.status(400).json({ error: " Phone number must be exactly 10 digits." });
  }

  const sql = `
    INSERT INTO admissions (
      name, age, dob, aadhar, previous_school,
      father_name, father_occupation, mother_name, mother_occupation,
      yearly_income, student_status, phone_number, email, address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.name,
    data.age,
    data.dob,
    data.aadhar || '',
    data.previous_school || '',
    data.father_name || '',
    data.father_occupation || '',
    data.mother_name || '',
    data.mother_occupation || '',
    data.yearly_income,
    data.student_status || '',
    phone,
    data.email || '',
    data.address || ''
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Insert failed:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "🎉 Admission submitted successfully!" });
  });
});

// ✅ POST /login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });

    if (results.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        reg_no: user.reg_no
      }
    });
  });
});

// ✅ Server listen
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
