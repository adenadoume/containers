# Container Planning App

A modern, Airtable-like interface for managing container shipments and logistics. Built with React, TypeScript, and Tailwind CSS.

## Features

### 🚢 Container Management
- **Container Selector**: Easy dropdown to switch between different containers (I110.11, I110.9, etc.)
- **Real-time Summary Metrics**: Automatic calculation of:
  - Total CBM, Cartons, and Gross Weight
  - CBM Ready to Ship / Awaiting Supplier
  - Items needing payment
  - Product costs, Freight costs, and Total costs

### 📊 Interactive Data Table
- **Inline Editing**: Click any cell to edit data directly
- **Excel-style Interface**: Alternating row colors for easy reading
- **Horizontal Scrolling**: View all columns comfortably
- **Status Management**: 
  - Color-coded status badges (Ready to Ship, Awaiting Supplier, Need Payment, Pending)
  - Single-select dropdowns for tracking what's awaiting (Payment, Certificates, Documents, Inspection)

### 📎 Document Management
- **Multiple Attachment Types**: 
  - Packing List (PL)
  - Commercial Invoice (CI)
  - Payment documents
  - House Bill of Lading (HBL)
  - Certificates
- **File Upload**: Easy drag-and-drop or click-to-upload functionality
- **Document Preview**: View PDF, Excel, and Word documents in-app
- **Supported Formats**: PDF, Excel (.xlsx, .xls), Word (.doc, .docx)

### ➕ Dynamic Row Management
- Add new items with a single click
- All fields are editable
- Data persists in browser memory

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- Modern ES6+ features

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/adenadoume/containers.git
cd containers
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

\`\`\`bash
npm run build
\`\`\`

The built files will be in the `dist` folder, ready to deploy.

## Usage

### Adding Data
1. Click **"Add new item"** at the bottom of the table
2. Click on any cell to edit its content
3. Press Enter or click outside to save

### Managing Status
- Click on status badges to change shipment status
- Use the "Awaiting" dropdown to track what's pending

### Uploading Documents
- Click the upload icon (↑) in any attachment column
- Select your file (PDF, Excel, or Word)
- Click the document icon to preview

### Switching Containers
- Use the dropdown at the top to switch between containers
- Each container maintains its own data set

## Project Structure

\`\`\`
containers/
├── public/
│   └── miktoyear.xlsx        # Sample Excel file
├── src/
│   ├── App.tsx               # Main application component
│   ├── App.css              # Component styles
│   ├── index.css            # Global styles
│   └── main.tsx             # Application entry point
├── index.html               # HTML template
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
\`\`\`

## Future Enhancements

- [ ] Backend integration for data persistence
- [ ] Export to Excel functionality
- [ ] Real-time collaboration features
- [ ] Advanced filtering and sorting
- [ ] PDF report generation
- [ ] Email notifications for status changes
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Contact

For questions or support, please contact the repository owner.

---

Built with ❤️ for efficient container logistics management

