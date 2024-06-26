import * as React from 'react';

interface DataTableProps {
  columnHeaders: string[];
  itemsPerPageOptions: number[];
  defaultItemsPerPage: number;
  data: any[];
}

interface DataTableState {
  columnFilters: { [key: string]: string };
  globalFilter: string;
  currentPage: number;
  itemsPerPage: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  columnSelections: { [key: string]: Set<string> };
  columnAlignments: { [key: string]: 'left' | 'center' | 'right' };
  columnDropdownVisible: { [key: string]: boolean };
  columnSuggestions: { [key: string]: string[] };
}

class DataTable extends React.Component<DataTableProps, DataTableState> {
  constructor(props: DataTableProps) {
    super(props);

    this.state = {
      columnFilters: Object.fromEntries(props.columnHeaders.map(header => [header, ''])),
      globalFilter: '',
      currentPage: 1,
      itemsPerPage: props.defaultItemsPerPage,
      sortColumn: '',
      sortDirection: 'asc',
      columnSelections: Object.fromEntries(props.columnHeaders.map(header => [header, new Set<string>()])),
      columnAlignments: Object.fromEntries(props.columnHeaders.map(header => [header, 'left'])),
      columnDropdownVisible: Object.fromEntries(props.columnHeaders.map(header => [header, false])),
      columnSuggestions: Object.fromEntries(props.columnHeaders.map(header => [header, []])),
    };
  }

  handleColumnFilter = (header: string, value: string) => {
    const { columnSelections } = this.state;
    const selectedSet = new Set(columnSelections[header]);
    if (selectedSet.has(value)) {
      selectedSet.delete(value);
    } else {
      selectedSet.add(value);
    }
    this.setState(prevState => ({
      columnSelections: {
        ...prevState.columnSelections,
        [header]: selectedSet
      },
      currentPage: 1
    }));
  };

  handleGlobalFilter = (value: string) => {
    this.setState({ globalFilter: value.toLowerCase(), currentPage: 1 });
  };

  handlePageChange = (page: number) => {
    this.setState({ currentPage: page });
  };

  handleItemsPerPageChange = (value: number) => {
    this.setState({ itemsPerPage: value === -1 ? Infinity : value, currentPage: 1 });
  };

  toggleColumnDropdown = (header: string) => {
    this.setState(prevState => ({
      columnDropdownVisible: {
        ...prevState.columnDropdownVisible,
        [header]: !prevState.columnDropdownVisible[header]
      }
    }));
  };

  handleSort = (header: string) => {
    const { sortColumn, sortDirection } = this.state;
    let newSortDirection: 'asc' | 'desc' = 'asc';
    if (sortColumn === header) {
      newSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    this.setState({
      sortColumn: header,
      sortDirection: newSortDirection,
      currentPage: 1
    });
  };

  handleAlignmentChange = (header: string, alignment: 'left' | 'center' | 'right') => {
    this.setState(prevState => ({
      columnAlignments: {
        ...prevState.columnAlignments,
        [header]: alignment
      }
    }));
  };

  getSortButtonText = (header: string) => {
    const { sortColumn, sortDirection } = this.state;
    if (sortColumn === header) {
      return sortDirection === 'asc' ? '▲' : '▼';
    }
    return 'Sort';
  };

  handleColumnSearch = (header: string, searchText: string) => {
    const { data, columnHeaders } = this.props;
    const headerIndex = columnHeaders.indexOf(header);

    // Use a Set to keep track of unique values
    const uniqueSuggestions = new Set<string>();

    data.forEach(row => {
      if (row) {
        const cellValue = `${row[headerIndex] || ''}`.toLowerCase();
        if (cellValue.includes(searchText.toLowerCase())) {
          uniqueSuggestions.add(cellValue);
        }
      }
    });

    // Convert the Set back to an array
    const filteredSuggestions = Array.from(uniqueSuggestions);

    this.setState(prevState => ({
      columnSuggestions: {
        ...prevState.columnSuggestions,
        [header]: filteredSuggestions
      },
      columnFilters: {
        ...prevState.columnFilters,
        [header]: searchText // Update columnFilters[header] with current search text
      },
      currentPage: 1
    }));
  };

  handleSuggestionSelect = (header: string, value: string) => {
    const { columnFilters } = this.state;
    this.setState({
      columnFilters: {
        ...columnFilters,
        [header]: value
      },
      columnSuggestions: {
        ...this.state.columnSuggestions,
        [header]: []
      },
      currentPage: 1
    });
  };

  render() {
    const { columnHeaders, itemsPerPageOptions, data } = this.props;
    const {
      columnFilters,
      globalFilter,
      currentPage,
      itemsPerPage,
      columnDropdownVisible,
      sortColumn,
      sortDirection,
      columnSelections,
      columnAlignments,
      columnSuggestions
    } = this.state;

    const filteredData = data.filter(row => {
      return row && columnHeaders.every(header => {
        const filterValue = columnFilters[header].toLowerCase();
        const cellValue = `${row[columnHeaders.indexOf(header)] || ''}`.toLowerCase();
        return cellValue.includes(filterValue);
      }) && (
        columnHeaders.some(header => {
          const cellValue = `${row[columnHeaders.indexOf(header)] || ''}`.toLowerCase();
          return cellValue.includes(globalFilter);
        }) || globalFilter === ''
      );
    });

    const selectedFilters = Object.entries(columnSelections).filter(([key, value]) => value.size > 0);
    const filteredAndSelectedData = filteredData.filter(row => {
      return selectedFilters.every(([header, selectedSet]) => {
        const cellValue = `${row ? row[columnHeaders.indexOf(header)] || '' : ''}`.toLowerCase();
        return selectedSet.has(cellValue);
      });
    });

    const sortedData = filteredAndSelectedData.sort((a, b) => {
      if (!sortColumn) return 0;
      const index = columnHeaders.indexOf(sortColumn);
      const valueA = a ? a[index] : undefined;
      const valueB = b ? b[index] : undefined;
      if (valueA === undefined || valueB === undefined) return 0;
      return sortDirection === 'asc' ? (valueA < valueB ? -1 : 1) : (valueA > valueB ? -1 : 1);
    });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = itemsPerPage === Infinity ? sortedData : sortedData.slice(startIndex, startIndex + itemsPerPage);

    const uniqueColumnValues = columnHeaders.reduce((acc, header) => {
      const uniqueValues = Array.from(new Set(data.map(row => row ? `${row[columnHeaders.indexOf(header)] || ''}`.toLowerCase() : '')));
      return { ...acc, [header]: uniqueValues };
    }, {} as { [key: string]: string[] });

    return (
      <div>
        <input
          type="text"
          placeholder="Search all columns..."
          value={globalFilter}
          onChange={(e) => this.handleGlobalFilter(e.target.value)}
        />
        <br />
        <br/>
        <div>
          <label>Select items per page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => this.handleItemsPerPageChange(parseInt(e.target.value))}
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option === -1 ? 'All' : option}
              </option>
            ))}
          </select>
        </div>
        <table>
          <thead>
            <tr>
              {columnHeaders.map((header) => (
                <th key={header} style={{ position: 'relative' }}>
                  <div>
                    <span onClick={() => this.toggleColumnDropdown(header)}>{header}</span>
                    <button onClick={() => this.handleSort(header)}>
                      {this.getSortButtonText(header)}
                    </button>
                  </div>
                  {columnDropdownVisible[header] && (
                   <div className="dropdown">
                   <div>
                     <label>Search:</label>
                     <input
                          type="text"
                          placeholder={`Search ${header}...`}
                          value={columnFilters[header]} // Ensure correct binding here
                          onChange={(e) => this.handleColumnSearch(header, e.target.value)}
                        />
                    {columnSuggestions[header].length > 0 && (
                          <div>
                            {columnSuggestions[header].map((value, index) => (
                              <button
                                key={index}
                                onClick={() => this.handleSuggestionSelect(header, value)}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        )}
                   </div>
                   <div>
                     <label>Alignment:</label>
                     <select
                       value={columnAlignments[header]}
                       onChange={(e) => this.handleAlignmentChange(header, e.target.value as 'left' | 'center' | 'right')}
                     >
                       <option value="left">Left</option>
                       <option value="center">Center</option>
                       <option value="right">Right</option>
                     </select>
                   </div>
                   <div>
                   
                     {uniqueColumnValues[header].map((value, index) => (
                       <label key={index}>
                         <input
                           type="checkbox"
                           checked={columnSelections[header].has(value)}
                           onChange={() => this.handleColumnFilter(header, value)}
                         />
                         {value}
                       </label>
                     ))}
                   </div>
                 </div>
                 
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row && row.map((cell:any, cellIndex:any) => (
                  <td key={cellIndex} style={{ textAlign: columnAlignments[columnHeaders[cellIndex]] }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <button onClick={() => this.handlePageChange(1)} disabled={currentPage === 1}>
            First
          </button>
          <button onClick={() => this.handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => this.handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
          <button onClick={() => this.handlePageChange(totalPages)} disabled={currentPage === totalPages}>
            Last
          </button>
        </div>
        <div>
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedData.length)} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
        </div>
      </div>
    );
  }
}

export default DataTable;
