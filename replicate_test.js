
const REPLICATE_API_TOKEN = "r8_Aw8OWVu7EnkkgvK7fRBew0fQR2Avm360IwT0M";

async function testReplicate() {
    console.log("Testing Replicate API with Node.js (ESM) and Base64...");
    const imageUrl = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";

    try {
        console.log("Downloading image...");
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUri = `data:${imageResponse.headers.get('content-type') || 'image/png'};base64,${base64}`;
        console.log("Image converted to base64 (length: " + base64.length + ")");

        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
                input: {
                    image: dataUri,
                },
            }),
        });

        if (!response.ok) {
            console.error("API Error:", response.status, await response.text());
            return;
        }

        const data = await response.json();
        console.log("Prediction created:", data.id);

        const predictionId = data.id;
        let attempts = 0;

        while (attempts < 30) {
            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                headers: {
                    "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                },
            });

            const statusData = await statusResponse.json();
            console.log("Status:", statusData.status);

            if (statusData.status === "succeeded") {
                console.log("Success! Output:", statusData.output);
                break;
            } else if (statusData.status === "failed") {
                console.error("Failed:", statusData.error);
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

testReplicate();
