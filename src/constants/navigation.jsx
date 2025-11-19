function createIcon({ paths, filled = false }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    className: 'h-5 w-5 flex-none',
    'aria-hidden': true,
  };

  if (filled) {
    return props => (
      <svg {...commonProps} {...props}>
        {paths.map((d, index) => (
          <path key={index} fill="currentColor" d={d} />
        ))}
      </svg>
    );
  }

  return props => (
    <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      {paths.map((d, index) => (
        <path key={index} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
}

const DashboardIcon = createIcon({
  filled: true,
  paths: [
    'M3 3h8v8H3z',
    'M13 3h8v5h-8z',
    'M13 10h8v11h-8z',
    'M3 13h8v8H3z',
  ],
});

const ClassesIcon = createIcon({
  paths: [
    'M4 6h16M4 12h16M4 18h16',
    'M8 6v12',
  ],
});

const SubjectsIcon = createIcon({
  paths: [
    'M4.5 6.75l7.5-3 7.5 3',
    'M4.5 17.25l7.5 3 7.5-3',
    'M4.5 6.75v10.5',
    'M12 3.75v16.5',
    'M19.5 6.75v10.5',
  ],
});

const TeachersIcon = createIcon({
  paths: [
    'M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    'M4.5 19.5a7.5 7.5 0 0115 0',
  ],
});

const StudentsIcon = createIcon({
  paths: [
    'M12 12.75a4.5 4.5 0 100-9 4.5 4.5 0 000 9z',
    'M3.75 20.25a8.25 8.25 0 0116.5 0',
  ],
});

const ExamsIcon = createIcon({
  paths: [
    'M4.5 4.5h15v15h-15z',
    'M4.5 9h15',
    'M9 4.5v15',
    'M12 13.5h3',
  ],
});

const AssignmentsIcon = createIcon({
  paths: [
    'M4.5 5.25l7.5-3 7.5 3',
    'M4.5 5.25v13.5h7.5',
    'M19.5 9.75l-6 6-3-3',
  ],
});

const ResultsIcon = createIcon({
  paths: [
    'M4.5 5.25h15v13.5h-15z',
    'M8.25 9.75l2.25 2.25 4.5-4.5',
    'M7.5 15.75h9',
  ],
});

const PublicIcon = createIcon({
  paths: [
    'M12 3a9 9 0 100 18 9 9 0 000-18z',
    'M2.25 12h19.5',
    'M12 2.25s3.75 3.75 3.75 9S12 20.25 12 20.25',
    'M12 2.25S8.25 6 8.25 11.25 12 20.25 12 20.25',
  ],
});

const TeacherPortalIcon = createIcon({
  paths: [
    'M4.5 6.75h15v10.5h-15z',
    'M8.25 6.75V5.25A2.25 2.25 0 0110.5 3h3a2.25 2.25 0 012.25 2.25v1.5',
    'M9 12h6',
    'M9 15h4.5',
  ],
});

export const navigationItems = [
  {
    label: 'Dashboard',
    description: 'Overview, quick stats, and recent activity',
    to: '/dashboard',
    icon: DashboardIcon,
  },
  {
    label: 'Classes',
    description: 'Manage classes and sections',
    to: '/classes',
    icon: ClassesIcon,
  },
  {
    label: 'Subjects',
    description: 'Organize subjects by class',
    to: '/subjects',
    icon: SubjectsIcon,
  },
  {
    label: 'Teachers',
    description: 'Teacher directory and onboarding',
    to: '/teachers',
    icon: TeachersIcon,
  },
  {
    label: 'Students',
    description: 'Student roster and enrollment',
    to: '/students',
    icon: StudentsIcon,
  },
  {
    label: 'Exams',
    description: 'Plan exams and schedules',
    to: '/exams',
    icon: ExamsIcon,
  },
  {
    label: 'Assignments',
    description: 'Assign teachers to classes and subjects',
    to: '/assignments',
    icon: AssignmentsIcon,
  },
  {
    label: 'Results',
    description: 'Record and update exam results',
    to: '/results',
    icon: ResultsIcon,
  },
  {
    label: 'Teacher Portal',
    description: 'Teacher login & result submission',
    to: '/teacher-portal',
    icon: TeacherPortalIcon,
  },
  {
    label: 'Public Results',
    description: 'Lookup results by roll number',
    to: '/public-results',
    icon: PublicIcon,
  },
];

export const findNavigationItem = path =>
  navigationItems.find(item => path.startsWith(item.to)) || navigationItems[0];

