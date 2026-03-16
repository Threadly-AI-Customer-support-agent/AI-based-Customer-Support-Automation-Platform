from services.notification_service import NotificationService
from utils.logger import setup_logger


def main():
    setup_logger()

    notifier = NotificationService()

    print("--- Priority Alert ---")
    notifier.send_priority_alert(
        "agent_007@support.com",
        "TKT-9988",
        "Customer is frustrated with repeated AI failures."
    )

    print("\n--- Refund Update ---")
    notifier.send_refund_confirmation(
        "adarsh@gmail.com",
        "ORD-12345",
        "APPROVED"
    )

    print("\n--- Agent Assignment ---")
    notifier.send_agent_assignment(
        "customer@test.com",
        "TKT-1001",
        "khushi sharma"
    )


if __name__ == "__main__":
    main()