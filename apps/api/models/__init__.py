# Import all models so Base.metadata knows about every table.
# Required for Base.metadata.create_all() to work (used in tests).
from models.user import User, UserRole
from models.learning import Otp, UserBadge, UserCertificate
from models.allowed_domain import AllowedDomain
from models.school import School
from models.video import Video
from models.course import Course, CourseBlock, UserCourseProgress
from models.mooc import MOOC, MOOCModule, MOOCModuleCourse, UserMOOCEnrollment
from models.app import App
from models.insight import Insight, InsightStatus
from models.cohort import Cohort, CohortMember, CohortCourse, CohortStatus, MemberStatus
from models.audit import AuditLog, Report
from models.submission import Submission
from models.content import ContentBlock
