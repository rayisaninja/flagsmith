# Generated by Django 2.2.10 on 2020-02-21 21:26

from django.db import migrations


def add_edit_feature_permission(apps, schema_editor):
    PermissionModel = apps.get_model('permissions', 'PermissionModel')

    new_permission = ('EDIT_FEATURE', 'Ability to edit features in the given project (includes editing segments).')
    PermissionModel.objects.get_or_create(key=new_permission[0], description=new_permission[1], type='PROJECT')


class Migration(migrations.Migration):

    dependencies = [
        ('permissions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_edit_feature_permission, reverse_code=lambda *args: None)
    ]
