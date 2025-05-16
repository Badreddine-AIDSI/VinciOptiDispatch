from django.apps import AppConfig

class ClientOrderConfig(AppConfig):
    name = 'Client_Order'  # This should match your folder name exactly (case-sensitive)
    def ready(self):
        import Client_Order.signals  # Ensure signals are loaded