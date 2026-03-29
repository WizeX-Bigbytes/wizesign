"""Add twilio_config to hospitals and otp_channel to documents

Revision ID: a1b2c3d4e5f6
Revises: 37f9dfd4b821
Create Date: 2026-03-29 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '37f9dfd4b821'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add twilio_config JSON column to hospitals table
    op.add_column('hospitals', sa.Column('twilio_config', sa.JSON(), nullable=True))
    
    # Add otp_channel column to documents table
    op.add_column('documents', sa.Column('otp_channel', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'otp_channel')
    op.drop_column('hospitals', 'twilio_config')
