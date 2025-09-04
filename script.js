function loadProviders() {
  try {
    const storedProviders = localStorage.getItem("providers");
    if (storedProviders === null) {
      return [
        {
          id: 123,
          name: "Разработчик Василий",
          ratings: {},
          services: ["website-dev", "web-app-dev"],
        },
        {
          id: 456,
          name: "Маркетолог Анна",
          ratings: {},
          services: ["seo", "context-ads"],
        },
      ];
    }
    return JSON.parse(storedProviders);
  } catch (e) {
    return [
      {
        id: 123,
        name: "Разработчик Василий",
        ratings: {},
        services: ["website-dev", "web-app-dev"],
      },
      {
        id: 456,
        name: "Маркетолог Анна",
        ratings: {},
        services: ["seo", "context-ads"],
      },
    ];
  }
}

function saveProviders(providers) {
  try {
    localStorage.setItem("providers", JSON.stringify(providers));
  } catch (e) {}
}

let providers = loadProviders();
let satisfactionData = {};

document.addEventListener("DOMContentLoaded", function () {
  setupContractButtons();
  setupRatingPanels();
  renderSatisfactionChart();
});

function setupContractButtons() {
  document.querySelectorAll(".contract-button").forEach((button) => {
    button.addEventListener("click", () => {
      showHandshakeAnimation();
    });
  });
}

function showHandshakeAnimation() {
  const animationDiv = document.getElementById("handshake-animation");
  animationDiv.style.display = "block";
  animationDiv.innerHTML = `
    <svg width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="45" stroke="green" stroke-width="8" fill="yellow" />
    <text x="50" y="50" text-anchor="middle" dy=".3em">🤝</text>
    </svg>
    `;

  setTimeout(() => {
    animationDiv.style.display = "none";
    animationDiv.innerHTML = "";
  }, 2000);
}

function setupRatingPanels() {
  document.querySelectorAll(".service-provider-card").forEach((card) => {
    const providerId = parseInt(card.dataset.providerId);
    const ratingPanels = card.querySelectorAll(".rating-panel");
    const showRatingButtons = card.querySelectorAll(".show-rating-panel");

    showRatingButtons.forEach((button, index) => {
      const service = button.dataset.service;
      const ratingPanel = ratingPanels[index];
      const ctxId = `ratingChartCanvas-${providerId}-${service}`;

      ratingPanel.innerHTML = `
        <h4>Оцените:</h4>
        <label>Качество: <input type="range" min="1" max="5" value="5" data-rating-type="quality"></label><br>
        <label>Вежливость: <input type="range" min="1" max="5" value="5" data-rating-type="politeness"></label><br>
        <label>Пунктуальность: <input type="range" min="1" max="5" value="5" data-rating-type="punctuality"></label><br>
        <label>Цена: <input type="range" min="1" max="5" value="5" data-rating-type="price"></label><br>
        <button class="submit-rating" data-service="${service}">Отправить оценку</button>
      `;

      button.addEventListener("click", () => {
        ratingPanel.style.display =
          ratingPanel.style.display === "none" ? "block" : "none";
      });

      ratingPanel
        .querySelector(".submit-rating")
        .addEventListener("click", (event) => {
          const serviceForRating = event.target.dataset.service;
          const ratings = {};
          ratingPanel
            .querySelectorAll('input[type="range"]')
            .forEach((input) => {
              ratings[input.dataset.ratingType] = parseInt(input.value);
            });
          saveRating(providerId, ratings, serviceForRating);
          ratingPanel.style.display = "none";
        });
    });
  });
}

function saveRating(providerId, ratings, service) {
  const provider = providers.find((p) => p.id === providerId);

  if (!provider) {
    return;
  }

  if (!provider.ratings) {
    provider.ratings = {};
  }

  provider.ratings[service] = ratings;
  saveProviders(providers);
  calculateSatisfactionData();
  renderSatisfactionChart();
}

function calculateSatisfactionData() {
  satisfactionData = {};
  providers.forEach((provider) => {
    for (const service in provider.ratings) {
        const rating = provider.ratings[service];
        const month = new Date().getMonth();
        if (!satisfactionData[month]) {
          satisfactionData[month] = {
            totalRatings: 0,
            totalScore: 0,
          };
        }
        satisfactionData[month].totalRatings++;
        let ratingSum = 0;
        Object.values(rating).forEach((rate) => {
          ratingSum += rate;
        });
        satisfactionData[month].totalScore +=
          ratingSum / Object.keys(rating).length;
    }
  });
}

function renderSatisfactionChart() {
  const chartDiv = document.getElementById("satisfaction-chart");
  if (!chartDiv) return;

  calculateSatisfactionData();

  const labels = [];
  const data = [];
  const currentMonth = new Date().getMonth();
  for (let i = 0; i < 6; i++) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = new Date(2000, monthIndex, 1).toLocaleString("default", {
      month: "long",
    });
    labels.unshift(monthName);

    if (satisfactionData[monthIndex]) {
      const averageSatisfaction =
        satisfactionData[monthIndex].totalScore /
        satisfactionData[monthIndex].totalRatings;
      data.unshift(averageSatisfaction);
    } else {
      data.unshift(0);
    }
  }

  chartDiv.innerHTML = `
    <h3>Уровень удовлетворенности услугами (последние 6 месяцев)</h3>
    <canvas id="satisfactionChartCanvas" width="400" height="200"></canvas>
  `;

  const ctx = document
    .getElementById("satisfactionChartCanvas")
    .getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Средний балл удовлетворенности",
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
        },
      },
    },
  });
}