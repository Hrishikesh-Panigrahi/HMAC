import getpass

from django.core.management.base import BaseCommand, CommandError

from base.models import User


class Command(BaseCommand):
    help = "Create a student or professor account with a properly hashed password."

    def add_arguments(self, parser):
        parser.add_argument("email")
        parser.add_argument("--name", required=True, help="Full name shown in the app.")
        parser.add_argument("--user-id", help="Roll number or staff id (defaults to the part of the email before @).")
        parser.add_argument("--professor", action="store_true", help="Give access to the professor pages.")

    def handle(self, email, name, user_id, professor, **options):
        email = User.objects.normalize_email(email)
        user_id = user_id or email.split("@")[0]
        if User.objects.filter(email__iexact=email).exists():
            raise CommandError(f"An account for {email} already exists.")
        if User.objects.filter(user_id=user_id).exists() or User.objects.filter(username=user_id).exists():
            raise CommandError(f"User id {user_id!r} is taken; pass a different --user-id.")

        password = getpass.getpass("Password: ")
        if password != getpass.getpass("Password (again): "):
            raise CommandError("Passwords don't match.")
        if len(password) < 8:
            raise CommandError("Use at least 8 characters.")

        # username must be unique on this model, so reuse the user id for it.
        user = User(email=email, user_id=user_id, username=user_id, full_name=name,
                    is_active=True, is_staff=professor)
        user.set_password(password)
        user.save()
        role = "professor" if professor else "student"
        self.stdout.write(self.style.SUCCESS(f"Created {role} account {email}. They can sign in now."))
