// emailTemplates.test.js
const { emailTemplates } = require("./email");

test("appointmentConfirmation should return correct HTML string", () => {
  const html = emailTemplates.appointmentConfirmation(
    "Nam",
    "Dr. A",
    "10:00 AM"
  );
  expect(html).toContain("Nam");
  expect(html).toContain("Dr. A");
  expect(html).toContain("10:00 AM");
});

test("donationThankYou should return correct HTML string", () => {
  const html = emailTemplates.donationThankYou(
    "Mai",
    "500,000",
    "Hỗ trợ bệnh nhân nghèo"
  );
  expect(html).toContain("Mai");
  expect(html).toContain("500,000");
  expect(html).toContain("Hỗ trợ bệnh nhân nghèo");
});