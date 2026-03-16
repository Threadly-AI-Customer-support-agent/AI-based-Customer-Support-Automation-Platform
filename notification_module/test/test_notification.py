from services.notification_service import NotificationService


def test_service():
    service = NotificationService()

    service.send_priority_alert(
        "test@mail.com",
        "TEST-1",
        "Test issue"
    )

    print("Test executed")


if __name__ == "__main__":
    test_service()