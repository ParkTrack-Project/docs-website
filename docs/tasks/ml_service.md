---
sidebar_position: 5
title: ML-сервис прогнозирования
---

# ML-сервис прогнозирования занятости парковок

Репозиторий: [ParkTrack-Project/parktrack-ml](https://github.com/ParkTrack-Project/parktrack-ml)

---

## 1. Назначение

ML-сервис — самостоятельный микросервис, который:

- обучает модель машинного обучения на исторических данных занятости парковок;
- генерирует прогнозы занятости на заданные горизонты вперёд (например, +15, +30, +60 минут);
- записывает результаты прогноза в базу данных через `POST /forecasts/new`.

Сервис спроектирован так, чтобы его можно было:

- запускать вручную или по расписанию (cron);
- встраивать в общий `docker-compose` инфраструктуры ParkTrack;
- независимо обновлять и переобучать без изменения других компонентов системы.

---

## 2. Архитектура

Сервис состоит из двух независимых скриптов:

### `train.py` — обучение модели

1. Запрашивает исторические данные занятости через `GET /occupancy` за настраиваемый период.
2. Строит признаки: `zone_id`, `hour`, `minute`, `day_of_week`, `is_weekend`, `month`, `horizon_minutes`.
3. Тренирует LightGBM-регрессор на предсказание `occupied` через N минут.
4. Сохраняет модель и метаданные (вместимость зон, список горизонтов, дата обучения) в файл `.pkl`.

### `predict.py` — генерация прогнозов

1. Загружает сохранённую модель.
2. Для каждой зоны и каждого горизонта строит признаки по текущему времени.
3. Отправляет прогноз в API: `POST /forecasts/new` с `model_type=ml_model`.
4. 409-конфликты (дубликат прогноза) игнорируются без ошибки.

---

## 3. Структура репозитория

```
parktrack_ml/
├── api_client.py   # обёртка над ParkTrack API с Bearer-авторизацией
├── features.py     # построение признаков
├── train.py        # точка входа обучения
└── predict.py      # точка входа предсказания
Dockerfile.train
Dockerfile.predict
docker-compose.yml
.env.example
requirements.txt
README.md
```

---

## 4. Переменные окружения

| Переменная          | Обязательная | По умолчанию                | Описание                                         |
|---------------------|--------------|-----------------------------|--------------------------------------------------|
| `API_URL`           | да           | —                           | Базовый URL API (например `https://api.parktrack.live/api/v1`) |
| `API_TOKEN`         | да           | —                           | Bearer-токен с правом `forecasts.write`          |
| `MODEL_PATH`        | нет          | `models/forecast_model.pkl` | Путь к файлу модели                              |
| `FORECAST_HORIZONS` | нет          | `15,30,60`                  | Горизонты прогноза через запятую (минуты)        |
| `TRAIN_DAYS_BACK`   | нет          | `90`                        | Глубина истории для обучения (дней)              |

Для запуска: скопировать `.env.example` → `.env` и заполнить `API_URL`, `API_TOKEN`.

---

## 5. Запуск

### Локально

```bash
cp .env.example .env
# Заполнить API_URL и API_TOKEN в .env

python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Обучение
python -m parktrack_ml.train

# Предсказание (требует обученную модель)
python -m parktrack_ml.predict
```

### Docker Compose

```bash
# Обучение
docker compose --profile train up --build

# Предсказание
docker compose --profile predict up --build
```

---

## 6. Интеграция в общий deploy

Добавить в `deploy/docker-compose.yml`:

```yaml
  ml-predict:
    image: ghcr.io/parktrack-project/parktrack-ml-predict:latest
    environment:
      - API_URL=http://api-server:8000/api/v1
      - API_TOKEN=${ML_API_TOKEN}
      - MODEL_PATH=/models/forecast_model.pkl
      - FORECAST_HORIZONS=15,30,60
    volumes:
      - ml_models:/models
    depends_on:
      - api-server
    restart: unless-stopped

volumes:
  ml_models:
```

---

## 7. Расписание (cron)

```cron
# Переобучение — каждое воскресенье в 02:00 UTC
0 2 * * 0 docker compose -f /opt/parktrack-ml/docker-compose.yml --profile train up --build

# Прогноз — каждые 15 минут
*/15 * * * * docker compose -f /opt/parktrack-ml/docker-compose.yml --profile predict up
```

---

## 8. CI/CD

GitHub Actions собирает и публикует два образа в GHCR при каждом пуше в `main` или `development`:

| Образ | Тег |
|-------|-----|
| `ghcr.io/parktrack-project/parktrack-ml-train` | `latest` / `development` / `sha-*` |
| `ghcr.io/parktrack-project/parktrack-ml-predict` | `latest` / `development` / `sha-*` |

---

## 9. Взаимодействие с API

Сервис использует два раздела API:

| Метод | Эндпоинт | Назначение |
|-------|----------|------------|
| `GET` | `/occupancy` | Получение исторических данных для обучения |
| `GET` | `/zones` | Получение списка зон |
| `POST` | `/forecasts/new` | Запись прогноза |

Требуемые разрешения токена: `forecasts.write`.

---

## 10. Модель

- **Алгоритм**: LightGBM (`LGBMRegressor`)
- **Признаки**: `zone_id`, `hour`, `minute`, `day_of_week`, `is_weekend`, `month`, `horizon_minutes`
- **Целевая переменная**: `occupied` через N минут
- **Разбивка**: 85% обучение / 15% валидация (по времени, без перемешивания)
- **Метрика**: MAE (Mean Absolute Error) на валидационной выборке

Артефакт модели (`.pkl`) включает: обученную модель, имена признаков, горизонты прогноза, карту вместимости зон.
