
const REPLICATE_API_TOKEN = "r8_Aw8OWVu7EnkkgvK7fRBew0fQR2Avm360IwT0M";

async function testReplicate() {
    console.log("Testing Replicate API...");
    const imageUrl = "https://raw.githubusercontent.com/replicate/replicate-python/main/tests/data/logo.png"; // Simple test image

    try {
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", // rembg model
                input: {
                    image: imageUrl,
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
