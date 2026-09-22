# backend/scripts/create_demo_template.py

from __future__ import annotations

import argparse
import sys

from backend.database.mongo import (
    verify_database_connection,
)
from backend.services.demo_graph_service import (
    DEFAULT_DEMO_TEMPLATE_KEY,
    DEFAULT_DEMO_TEMPLATE_VERSION,
    DemoGraphService,
)


def parse_arguments():
    parser = argparse.ArgumentParser(
        description=(
            "Create an independent canonical Casendra "
            "demo template from an existing user case."
        )
    )

    parser.add_argument(
        "source_case_id",
        type=str,
        help=(
            "ID of the existing Casendra case that "
            "should be copied into a template."
        ),
    )

    parser.add_argument(
        "--template-key",
        type=str,
        default=(
            DEFAULT_DEMO_TEMPLATE_KEY
        ),
        help=(
            "Stable template identifier. "
            f"Default: "
            f"{DEFAULT_DEMO_TEMPLATE_KEY}"
        ),
    )

    parser.add_argument(
        "--version",
        type=int,
        default=(
            DEFAULT_DEMO_TEMPLATE_VERSION
        ),
        help=(
            "Template version. "
            f"Default: "
            f"{DEFAULT_DEMO_TEMPLATE_VERSION}"
        ),
    )

    parser.add_argument(
        "--title",
        type=str,
        default=None,
        help=(
            "Optional title for the canonical "
            "template. If omitted, the source "
            "case title is used."
        ),
    )

    return parser.parse_args()


def main() -> int:
    args = parse_arguments()

    if args.version < 1:
        print(
            "ERROR: Template version must "
            "be >= 1."
        )

        return 1

    template_key = (
        args.template_key.strip()
    )

    if not template_key:
        print(
            "ERROR: Template key must not "
            "be empty."
        )

        return 1

    source_case_id = (
        args.source_case_id.strip()
    )

    if not source_case_id:
        print(
            "ERROR: Source case ID must not "
            "be empty."
        )

        return 1

    # ---------------------------------------------------------
    # Database connection
    # ---------------------------------------------------------

    verify_database_connection()

    # ---------------------------------------------------------
    # Create template
    # ---------------------------------------------------------

    service = DemoGraphService()

    try:
        template_case = (
            service.create_template_from_case(
                source_case_id=(
                    source_case_id
                ),
                template_key=(
                    template_key
                ),
                template_version=(
                    args.version
                ),
                template_title=(
                    args.title
                ),
            )
        )

    except Exception as exc:
        print()
        print(
            "Failed to create demo template."
        )
        print()
        print(
            f"{type(exc).__name__}: {exc}"
        )

        return 1

    # ---------------------------------------------------------
    # Result
    # ---------------------------------------------------------

    print()
    print(
        "Demo template created successfully."
    )
    print()

    print(
        f"Source case ID: "
        f"{source_case_id}"
    )

    print(
        f"Template case ID: "
        f"{template_case.id}"
    )

    print(
        f"Template key: "
        f"{template_case.template_key}"
    )

    print(
        f"Template version: "
        f"{template_case.template_version}"
    )

    print(
        f"Template title: "
        f"{template_case.title}"
    )

    print(
        f"Template owner: "
        f"{template_case.owner_id}"
    )

    print(
        f"Is template: "
        f"{template_case.is_template}"
    )

    print()
    print(
        "The original case was not modified."
    )

    return 0


if __name__ == "__main__":
    sys.exit(
        main()
    )