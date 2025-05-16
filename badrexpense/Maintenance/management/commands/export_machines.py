from django.core.management.base import BaseCommand
from Maintenance.models import Machine
import json

class Command(BaseCommand):
    help = 'Export all machines to a JSON file'

    def handle(self, *args, **kwargs):
        machines = Machine.objects.all()
        machine_list = []

        for machine in machines:
            machine_data = {
                "id": machine.id,
                "name": machine.name,
                "description": machine.description,
            }
            machine_list.append(machine_data)

        with open('machines.json', 'w') as json_file:
            json.dump(machine_list, json_file, indent=4)

        self.stdout.write(self.style.SUCCESS('Successfully exported machines to machines.json'))
