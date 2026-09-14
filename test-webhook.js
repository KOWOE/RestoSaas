const url = "https://hooks.moneroo.io/ho_g2ozy8hh46l5";
const secret = "ih_01KYQX8F6XYP5482DCT1XSBEA7_3isfvogqqp5e_j4DvpIVxqaiz";

async function testWebhook() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`
      },
      body: JSON.stringify({
        amount: 5500,
        currency: "XOF",
        description: "Test Webhook Moneroo FedaPay Zagoor",
        customer: {
          email: "restaurateur@zagoor.com",
          first_name: "Chef",
          last_name: "Resto"
        },
        return_url: "http://localhost:3000/success"
      })
    });
    
    console.log("Status:", res.status);
    const data = await res.text();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

testWebhook();
