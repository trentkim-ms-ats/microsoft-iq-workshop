#!/usr/bin/env python3
"""Validate every generated Fabric Ontology definition part and cross-reference."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"{path}: invalid JSON: {exc}") from exc
    if not isinstance(payload, dict):
        raise ValueError(f"{path}: expected a JSON object")
    return payload


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def validate_binding_list(
    *,
    path: str,
    side: str,
    bindings: Any,
    expected_id_parts: list[str],
    errors: list[str],
) -> None:
    require(isinstance(bindings, list), f"{path}: {side}KeyRefBindings must be an array", errors)
    if not isinstance(bindings, list):
        return
    target_ids = [binding.get("targetPropertyId") for binding in bindings if isinstance(binding, dict)]
    source_columns = [binding.get("sourceColumnName") for binding in bindings if isinstance(binding, dict)]
    require(
        len(bindings) == len(expected_id_parts),
        f"{path}: {side}KeyRefBindings count {len(bindings)} does not match "
        f"entityIdParts count {len(expected_id_parts)}",
        errors,
    )
    require(
        target_ids == expected_id_parts,
        f"{path}: {side}KeyRefBindings targetPropertyId order does not match entityIdParts",
        errors,
    )
    require(
        all(isinstance(column, str) and column for column in source_columns),
        f"{path}: {side}KeyRefBindings contains an invalid sourceColumnName",
        errors,
    )
    require(
        len(source_columns) == len(set(source_columns)),
        f"{path}: {side}KeyRefBindings contains duplicate source columns",
        errors,
    )


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    json_paths = sorted(root.rglob("*.json"))
    platform_path = root / ".platform"
    require(bool(json_paths), f"{root}: no JSON files found", errors)
    require(platform_path.is_file(), f"{platform_path}: file not found", errors)

    payloads: dict[str, dict[str, Any]] = {}
    for path in [*json_paths, platform_path]:
        relative_path = path.relative_to(root).as_posix()
        try:
            payloads[relative_path] = load_json(path)
        except ValueError as exc:
            errors.append(str(exc))

    manifest = payloads.get("_manifest.json")
    if not manifest:
        errors.append(f"{root / '_manifest.json'}: manifest not found or invalid")
        return errors

    manifest_parts = manifest.get("parts")
    require(isinstance(manifest_parts, list), "_manifest.json: parts must be an array", errors)
    if isinstance(manifest_parts, list):
        require(
            len(manifest_parts) == len(set(manifest_parts)),
            "_manifest.json: duplicate part paths",
            errors,
        )
        for part_path in manifest_parts:
            require(
                isinstance(part_path, str) and (root / part_path).is_file(),
                f"_manifest.json: missing part file: {part_path}",
                errors,
            )
        actual_parts = {
            path.relative_to(root).as_posix()
            for path in root.rglob("*")
            if path.is_file() and path.name != "_manifest.json"
        }
        require(
            set(manifest_parts) == actual_parts,
            "_manifest.json: parts list does not exactly match generated files",
            errors,
        )

    entities: dict[str, dict[str, Any]] = {}
    relationships: dict[str, dict[str, Any]] = {}
    contextualizations: list[tuple[str, dict[str, Any]]] = []
    seen_ids: dict[str, str] = {}

    for relative_path, payload in payloads.items():
        if relative_path.startswith("EntityTypes/") and relative_path.endswith("/definition.json"):
            entity_id = payload.get("id")
            if isinstance(entity_id, str):
                entities[entity_id] = payload
        elif relative_path.startswith("RelationshipTypes/") and relative_path.endswith("/definition.json"):
            relationship_id = payload.get("id")
            if isinstance(relationship_id, str):
                relationships[relationship_id] = payload

    for relative_path, payload in payloads.items():
        if relative_path in {"_manifest.json", ".platform", "definition.json"}:
            continue
        part_id = payload.get("id")
        require(isinstance(part_id, str) and bool(part_id), f"{relative_path}: missing id", errors)
        if isinstance(part_id, str):
            previous_path = seen_ids.get(part_id)
            require(previous_path is None, f"{relative_path}: duplicate id also used by {previous_path}", errors)
            seen_ids[part_id] = relative_path

        if relative_path.startswith("EntityTypes/") and relative_path.endswith("/definition.json"):
            entity_id = payload.get("id")
            properties = payload.get("properties")
            id_parts = payload.get("entityIdParts")
            require(isinstance(properties, list) and bool(properties), f"{relative_path}: properties must be non-empty", errors)
            require(isinstance(id_parts, list) and bool(id_parts), f"{relative_path}: entityIdParts must be non-empty", errors)
            property_ids = {
                prop.get("id")
                for prop in properties or []
                if isinstance(prop, dict) and isinstance(prop.get("id"), str)
            }
            if isinstance(id_parts, list):
                require(
                    all(part in property_ids for part in id_parts),
                    f"{relative_path}: entityIdParts references an unknown property",
                    errors,
                )
        elif relative_path.startswith("RelationshipTypes/") and relative_path.endswith("/definition.json"):
            pass
        elif "/Contextualizations/" in relative_path:
            contextualizations.append((relative_path, payload))
        elif "/DataBindings/" in relative_path:
            entity_id = relative_path.split("/", 2)[1]
            configuration = payload.get("dataBindingConfiguration")
            require(isinstance(configuration, dict), f"{relative_path}: missing dataBindingConfiguration", errors)
            entity = entities.get(entity_id)
            require(entity is not None, f"{relative_path}: parent Entity definition not found", errors)
            if isinstance(configuration, dict) and entity:
                property_ids = {
                    prop.get("id")
                    for prop in entity.get("properties", [])
                    if isinstance(prop, dict)
                }
                bindings = configuration.get("propertyBindings")
                require(isinstance(bindings, list), f"{relative_path}: propertyBindings must be an array", errors)
                if isinstance(bindings, list):
                    target_ids = [
                        binding.get("targetPropertyId")
                        for binding in bindings
                        if isinstance(binding, dict)
                    ]
                    require(
                        set(target_ids) == property_ids and len(target_ids) == len(property_ids),
                        f"{relative_path}: propertyBindings do not cover every Entity property exactly once",
                        errors,
                    )

    for relationship_id, relationship in relationships.items():
        relative_path = seen_ids[relationship_id]
        source_id = relationship.get("source", {}).get("entityTypeId")
        target_id = relationship.get("target", {}).get("entityTypeId")
        require(source_id in entities, f"{relative_path}: source Entity does not exist: {source_id}", errors)
        require(target_id in entities, f"{relative_path}: target Entity does not exist: {target_id}", errors)

    for relative_path, contextualization in contextualizations:
        relationship_id = contextualization.get("relationshipTypeId")
        relationship = relationships.get(relationship_id)
        require(relationship is not None, f"{relative_path}: relationshipTypeId does not exist", errors)
        if not relationship:
            continue
        source_id = relationship["source"]["entityTypeId"]
        target_id = relationship["target"]["entityTypeId"]
        validate_binding_list(
            path=relative_path,
            side="source",
            bindings=contextualization.get("sourceKeyRefBindings"),
            expected_id_parts=entities[source_id]["entityIdParts"],
            errors=errors,
        )
        validate_binding_list(
            path=relative_path,
            side="target",
            bindings=contextualization.get("targetKeyRefBindings"),
            expected_id_parts=entities[target_id]["entityIdParts"],
            errors=errors,
        )

    counts = manifest.get("counts", {})
    require(counts.get("entities") == len(entities), "_manifest.json: entity count mismatch", errors)
    require(
        counts.get("physicalRelationships") == len(contextualizations),
        "_manifest.json: physical relationship count mismatch",
        errors,
    )
    require(
        counts.get("physicalRelationships", 0) + counts.get("logicalRelationships", 0)
        == len(relationships),
        "_manifest.json: total relationship count mismatch",
        errors,
    )
    require(
        counts.get("totalParts") == len(manifest_parts or []),
        "_manifest.json: totalParts mismatch",
        errors,
    )
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate Fabric Ontology definition parts.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent / "definition_parts",
    )
    args = parser.parse_args()
    root = args.root.resolve()
    errors = validate(root)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(f"Validation failed with {len(errors)} error(s).")
    json_count = len(list(root.rglob("*.json")))
    print(f"PASS: validated {json_count} JSON files and {root / '.platform'}")


if __name__ == "__main__":
    main()
