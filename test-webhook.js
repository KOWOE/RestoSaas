const url = "https://hooks.moneroo.io/ho_7rd8rwv2083s";
const secret = "ih_01KYQX8F6XYP5482DCT1XSBEA7_ccmy2l0a4gyk_RNbbQBsyOcAw";

async function testWebhook() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`
      },
      body: JSON.stringify({
        amount: 1000,
        currency: "XOF",
        description: "Test Order",
        customer: {
          email: "test@example.com",
          first_name: "Test",
          last_name: "User"
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
