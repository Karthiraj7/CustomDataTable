import * as React from 'react';
import DataTable from './DataTable';
import { data } from './Data';
import { IHelloWorldProps } from './IHelloWorldProps';

const columnHeaders = [
  "Country",
  "Name",
  "Sell date",
  "Order ID",
  "In stock",
  "Qty"
];

const DEFAULT_ITEMS_PER_PAGE = 20;
const ITEMS_PER_PAGE_OPTIONS = [5, 15, 25, 50, -1];

class HelloWorld extends React.Component<IHelloWorldProps> {
  render() {
    return (
      <div>
        <DataTable
          columnHeaders={columnHeaders}
          itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
          defaultItemsPerPage={DEFAULT_ITEMS_PER_PAGE}
          data={data}
        />
      </div>
    );
  }
}

export default HelloWorld;
