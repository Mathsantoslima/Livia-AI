const axios = require("axios");
const qrcode = require("qrcode-terminal");

// Configurações
const apiUrl = "http://localhost:8080/qrcode";
const apiKey = "12588eb53f90c49aff2f0cdfca0a4878";

async function getAndDisplayQRCode() {
  try {
    console.log("Obtendo QR code da API do WhatsApp...");

    const response = await axios.get(apiUrl, {
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (response.data && response.data.status === "success") {
      if (response.data.qrcode) {
        console.log(
          "Escaneie o QR code abaixo com o aplicativo WhatsApp do seu celular:"
        );
        console.log(
          "----------------------------------------------------------"
        );

        // Gerar e exibir o QR code
        qrcode.generate(response.data.qrcode, { small: true });

        console.log(
          "----------------------------------------------------------"
        );
        console.log("Após escanear, aguarde a conexão ser estabelecida.");
      } else {
        console.log(
          "Já existe uma conexão ativa ou o QR code ainda não está disponível."
        );
      }
    } else {
      console.error("Erro ao obter QR code:", response.data);
    }
  } catch (error) {
    console.error("Erro ao comunicar com a API:", error.message);
  }
}

// Executar a função principal
getAndDisplayQRCode();
