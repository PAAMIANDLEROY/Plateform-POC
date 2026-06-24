"""
Validation des données de la migration de seed 0006 (cours de démo).
Vérifie, sans base de données, que les valeurs d'enum (niveau, statut, type de
bloc) sont valides — une faute de frappe ferait échouer la migration en silence
au démarrage (run_migrations avale les exceptions).
"""
import importlib.util
import pathlib

from models.course import CourseLevel, CourseStatus, BlockType


def _load_migration(filename: str, modname: str):
    path = (
        pathlib.Path(__file__).resolve().parent.parent
        / "alembic" / "versions" / filename
    )
    spec = importlib.util.spec_from_file_location(modname, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _load_seed_migration():
    return _load_migration("0006_seed_demo_courses.py", "seed_0006")


def _load_content_migration():
    return _load_migration("0007_seed_demo_content.py", "seed_0007")


def test_seed_courses_have_valid_levels_and_status():
    mod = _load_seed_migration()
    assert len(mod.COURSES) >= 1
    ids = set()
    for cid, title, desc, category, level, school, duration, status in mod.COURSES:
        CourseLevel(level)    # lève ValueError si invalide
        CourseStatus(status)  # idem
        assert duration > 0
        assert title and desc and category
        assert cid not in ids, f"id de cours dupliqué : {cid}"
        ids.add(cid)


def test_seed_block_types_are_valid():
    mod = _load_seed_migration()
    blocks = mod._blocks_for("Titre test", "Description test")
    assert blocks
    for btype, content in blocks:
        BlockType(btype)               # lève ValueError si invalide
        assert isinstance(content, dict)
    # Le bloc quiz doit exposer la structure attendue par le front.
    quiz = next((c for t, c in blocks if t == "quiz"), None)
    assert quiz is not None
    assert isinstance(quiz["options"], list) and len(quiz["options"]) >= 2
    assert isinstance(quiz["answer"], int) and 0 <= quiz["answer"] < len(quiz["options"])


def test_content_seed_videos_and_apps_valid():
    mod = _load_content_migration()
    vids = {v[0] for v in mod.VIDEOS}
    assert len(vids) == len(mod.VIDEOS), "id de vidéo dupliqué"
    for v in mod.VIDEOS:
        assert mod._dur_to_seconds(v[7]) > 0   # durée parsable et non nulle
    apps = {a[0] for a in mod.APPS}
    assert len(apps) == len(mod.APPS), "id d'app dupliqué"
    for a in mod.APPS:
        assert a[3].startswith("http"), "url d'app invalide"


def test_content_seed_duration_parsing():
    mod = _load_content_migration()
    assert mod._dur_to_seconds("42:18") == 2538
    assert mod._dur_to_seconds("1:12:05") == 4325


def test_mooc_modules_reference_seeded_courses():
    """Chaque cours référencé par un MOOC doit exister dans le seed 0006."""
    course_mod = _load_seed_migration()
    content_mod = _load_content_migration()
    seeded_course_ids = {c[0] for c in course_mod.COURSES}
    for mid, title, desc, school, modules in content_mod.MOOCS:
        for mod_title, course_ids in modules:
            for cid in course_ids:
                assert cid in seeded_course_ids, f"MOOC {mid} référence un cours absent : {cid}"


def test_insights_seed_data_valid():
    mod = _load_migration("0008_create_seed_insights.py", "seed_0008")
    assert len(mod.INSIGHTS) == 4
    ids = set()
    valid_block_types = {"text", "heading", "code", "quote", "key-insight", "figure", "divider"}
    for art in mod.INSIGHTS:
        assert art["id"] not in ids, "id d'article dupliqué"
        ids.add(art["id"])
        assert art["title"] and art["abstract"]
        assert isinstance(art["authors"], list) and art["authors"]
        assert isinstance(art["blocks"], list) and art["blocks"]
        for block in art["blocks"]:
            assert block["type"] in valid_block_types, f"type de bloc inconnu : {block['type']}"
