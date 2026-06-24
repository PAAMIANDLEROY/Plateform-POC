"""
Validation des données de la migration de seed 0006 (cours de démo).
Vérifie, sans base de données, que les valeurs d'enum (niveau, statut, type de
bloc) sont valides — une faute de frappe ferait échouer la migration en silence
au démarrage (run_migrations avale les exceptions).
"""
import importlib.util
import pathlib

from models.course import CourseLevel, CourseStatus, BlockType


def _load_seed_migration():
    path = (
        pathlib.Path(__file__).resolve().parent.parent
        / "alembic" / "versions" / "0006_seed_demo_courses.py"
    )
    spec = importlib.util.spec_from_file_location("seed_0006", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


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
