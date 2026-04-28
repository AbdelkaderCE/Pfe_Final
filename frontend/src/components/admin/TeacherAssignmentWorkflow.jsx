import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  User,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react';

const TeacherAssignmentWorkflow = ({ onComplete }) => {
  const [step, setStep] = useState(1); // 1: Select Teacher & Subject, 2: View Group Students
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch teachers on mount
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/admin/users?role=enseignant', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch teachers');

      const result = await response.json();
      const teacherUsers = (result.data || []).filter((user) =>
        Array.isArray(user.roles)
          && user.roles.some((roleName) => {
            const normalized = String(roleName || '').toLowerCase();
            return normalized === 'enseignant' || normalized === 'teacher';
          })
      );
      setTeachers(teacherUsers);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSelect = async (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedCourse(null);
    setSelectedGroup(null);
    setGroupDetails(null);

    // Fetch courses taught by this teacher
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/pfe/teacher/${teacher.id}/courses`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch courses');

      const result = await response.json();
      setCourses(result.data);
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setSelectedGroup(null);
    setGroupDetails(null);

    // Fetch groups for this course
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/pfe/course/${course.id}/groups`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch groups');

      const result = await response.json();
      setGroups(result.data);
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = async (group) => {
    setSelectedGroup(group);

    // Fetch group details including students
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/pfe/groups/${group.id}/with-teacher`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch group details');

      const result = await response.json();
      setGroupDetails(result.data);
      setStep(2);
      if (onComplete) {
        onComplete(group);
      }
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSelectedGroup(null);
    setGroupDetails(null);
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <User className="w-8 h-8 text-blue-600" />
        Teacher & Group Assignment
      </h2>
      <p className="text-gray-600 mb-6">
        Assign teachers to teach courses and view their assigned groups
      </p>

      {/* Progress Indicator */}
      <div className="mb-8 flex items-center justify-between">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
            step >= 1
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          1
        </div>
        <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
            step >= 2
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          2
        </div>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-edge-strong'
              : 'bg-red-50 border border-edge-strong'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Step 1: Select Teacher & Course */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Teachers */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Teachers
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto border border-edge rounded-lg p-3">
              {loading && teachers.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    onClick={() => handleTeacherSelect(teacher)}
                    className={`w-full text-left p-3 border rounded-lg transition ${
                      selectedTeacher?.id === teacher.id
                        ? 'border-edge-strong bg-blue-50'
                        : 'border-edge hover:bg-surface-200'
                    }`}
                  >
                    <p className="font-medium text-gray-900">
                      {teacher.prenom} {teacher.nom}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{teacher.email}</p>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No teachers found</p>
              )}
            </div>
          </div>

          {/* Courses */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Courses
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto border border-edge rounded-lg p-3">
              {!selectedTeacher ? (
                <p className="text-center text-gray-500 py-4">
                  Select a teacher first
                </p>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseSelect(course)}
                    className={`w-full text-left p-3 border rounded-lg transition ${
                      selectedCourse?.id === course.id
                        ? 'border-edge-strong bg-green-50'
                        : 'border-edge hover:bg-surface-200'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{course.name}</p>
                    <p className="text-sm text-gray-500">{course.code}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {course.promo}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No courses found
                </p>
              )}
            </div>
          </div>

          {/* Groups */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Groups
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto border border-edge rounded-lg p-3">
              {!selectedCourse ? (
                <p className="text-center text-gray-500 py-4">
                  Select a course first
                </p>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : groups.length > 0 ? (
                groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group)}
                    className="w-full text-left p-3 border border-edge rounded-lg hover:bg-surface-200 hover:border-brand transition"
                  >
                    <p className="font-medium text-gray-900">{group.nom}</p>
                    <p className="text-sm text-gray-500">
                      {group.studentCount || 0} students
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No groups found
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Group Students */}
      {step === 2 && groupDetails && (
        <div className="space-y-6">
          {/* Group Info Card */}
          <div className="bg-brand-light border border-edge-strong rounded-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {groupDetails.nom}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject Info */}
              {groupDetails.sujet && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    SUBJECT
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {groupDetails.sujet.titre}
                  </p>
                  {groupDetails.sujet.enseignant && (
                    <p className="text-sm text-gray-600 mt-2">
                      Supervisor: {groupDetails.sujet.enseignant.prenom}{' '}
                      {groupDetails.sujet.enseignant.nom}
                    </p>
                  )}
                </div>
              )}

              {/* Defense Info */}
              {groupDetails.dateSoutenance && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    DEFENSE
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(groupDetails.dateSoutenance).toLocaleDateString()}
                  </p>
                  {groupDetails.lieu && (
                    <p className="text-sm text-gray-600 mt-2">
                      Location: {groupDetails.lieu}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Students Table */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Assigned Students ({groupDetails.students.length})
            </h3>

            <div className="overflow-x-auto border border-edge rounded-lg">
              <table className="w-full">
                <thead className="bg-brand-light border-b border-edge">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {groupDetails.students.length > 0 ? (
                    groupDetails.students.map((student, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className="font-medium">
                            {student.prenom} {student.nom}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {student.role === 'chef_groupe' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              👑 Leader
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              Member
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                        No students assigned to this group yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={handleBackToStep1}
            className="w-full bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition"
          >
            ← Back to Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentWorkflow;

