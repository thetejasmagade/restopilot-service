import express, { Request, Response } from 'express';

export const userRouter = (db: any) => {
  const router = express.Router();
  const usersCollection = db.collection('users');

  // GET all users
  router.get('/', async (req: Request, res: Response) => {
    const { _id } = req.body;
    try {
      if (_id == '8433887822') {
        const users = await usersCollection.find({}, { projection: { password: 0, kitchen_password: 0, _id: 0 } }).toArray();
        res.status(200).json(users);
      } else {
        res.status(401).json({ message: 'Unauthorized' });
      }
    } catch (err) {
      res.status(500).json({ message: 'Error fetching users', error: err });
    }
  });

  // POST create a new user
  router.post('/', async (req: any, res: any) => {
    const { mobile, password, user_type } = req.body;

    try {
      // Find user by mobile number
      const user = await usersCollection.findOne({ mobile });

      // If user doesn't exist
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if the provided password matches the stored one
      if (user_type == 'billing') {
        if (user.password !== password) {
          return res.status(401).json({ message: 'Incorrect password' });
        } else {
          // If mobile and password match, return the user info (excluding password)
          const { password: userPassword, kitchen_password: kitchenUserPassword, orders: orders, ...userInfo } = user;
          console.log(userInfo);
          return res.status(200).json(userInfo); // Return user data without password
        }
      } else {
        if (user.kitchen_password !== password) {
          return res.status(401).json({ message: 'Incorrect password' });
        } else {
          // If mobile and password match, return the user info (excluding password)
          const { password: userPassword, kitchen_password: kitchenUserPassword, filters: filters, items: items, table_data: tableData, orders: orders, ...userInfo } = user;
          console.log(userInfo);
          return res.status(200).json(userInfo); // Return user data without password
        }
      }
    } catch (err) {
      res.status(500).json({ message: 'Error authenticating user', error: err });
    }
  });

  router.post('/get-tables-data', async (req: any, res: any) => {
    const { mobile } = req.body;

    // Validate if mobile is provided
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
      //   // Find user by mobile number
      const user = await usersCollection.findOne({ mobile });

      //   // If user doesn't exist
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if table_data exists
      const { table_data } = user;
      if (!table_data) {
        return res.status(404).json({ message: 'Table data not found' });
      }

      // Return table data
      return res.status(200).json(table_data);
    } catch (err) {
      console.error('Error:', err);  // Log the error for debugging
      res.status(500).json({ message: 'Error authenticating user', error: err });
    }
  });

  router.post('/update-kot', async (req: any, res: any) => {
    const { mobile, table_data_id, table_id, status, total_amt, order_type, items } = req.body;

    console.log(mobile, table_data_id, table_id, status, total_amt, order_type, items);

    // Validate if mobile is provided
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
      // Find user by mobile number
      const user = await usersCollection.findOne({ mobile });

      // If user doesn't exist
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if table_data exists
      const { table_data } = user;

      if (!table_data) {
        return res.status(404).json({ message: 'Table data not found' });
      }

      // Find the table data by table_data_id
      const tableDataEntry = table_data.find((tableDataItem: any) => tableDataItem.id === table_data_id);

      if (!tableDataEntry) {
        return res.status(404).json({ message: 'Table data entry not found' });
      }

      // Find the table by table_id
      const table = tableDataEntry.tables.find((tableItem: any) => tableItem.id === table_id);

      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }

      // Update the status, total_amt, order_type, and items
      table.status = status;
      table.total_amt = total_amt;
      table.order_type = order_type;
      table.items = items; // Assuming `items` comes as an array with updated data

      // Update the table data in the database
      await usersCollection.updateOne(
        { mobile },
        {
          $set: {
            "table_data.$[elem].tables.$[table].status": status,
            "table_data.$[elem].tables.$[table].total_amt": total_amt,
            "table_data.$[elem].tables.$[table].order_type": order_type,
            "table_data.$[elem].tables.$[table].items": items
          }
        },
        {
          arrayFilters: [
            { "elem.id": table_data_id },
            { "table.id": table_id }
          ]
        }
      );

      // Return the updated table data
      return res.status(200).json(tableDataEntry);
    } catch (err) {
      console.error('Error:', err);  // Log the error for debugging
      res.status(500).json({ message: 'Error updating table', error: err });
    }
  });


  router.post('/temp-save', async (req: any, res: any) => {
    const { mobile, table_data_id, table_id, status } = req.body;

    console.log(mobile, table_data_id, table_id, status);

    // Validate if mobile is provided
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
      // Find user by mobile number
      const user = await usersCollection.findOne({ mobile });

      // If user doesn't exist
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if table_data exists
      const { table_data } = user;

      if (!table_data) {
        return res.status(404).json({ message: 'Table data not found' });
      }

      // Find the table data by table_data_id
      const tableDataEntry = table_data.find((tableDataItem: any) => tableDataItem.id === table_data_id);

      if (!tableDataEntry) {
        return res.status(404).json({ message: 'Table data entry not found' });
      }

      // Find the table by table_id
      const table = tableDataEntry.tables.find((tableItem: any) => tableItem.id === table_id);

      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }

      // Update the status, total_amt, order_type, and items
      table.status = status;

      // Update the table data in the database
      await usersCollection.updateOne(
        { mobile },
        { $set: { "table_data.$[elem].tables.$[table].status": status, } },
        {
          arrayFilters: [
            { "elem.id": table_data_id },
            { "table.id": table_id }
          ]
        }
      );

      // Return the updated table data
      return res.status(200).json(tableDataEntry);
    } catch (err) {
      console.error('Error:', err);  // Log the error for debugging
      res.status(500).json({ message: 'Error updating table', error: err });
    }
  });


  router.post('/save-ebill', async (req: any, res: any) => {
    const { mobile, table_data_id, table_id, table_name, status, total_amt, order_type, items, payment_type, customer_info } = req.body;

    // console.log(mobile, table_data_id, table_id, table_name, status, total_amt, order_type, items, payment_type, customer_info);

    // Validate if mobile is provided
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
      // Find user by mobile number
      const user = await usersCollection.findOne({ mobile });

      // If user doesn't exist
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if table_data exists
      const { table_data } = user;

      if (!table_data) {
        return res.status(404).json({ message: 'Table data not found' });
      }

      // Find the table data by table_data_id
      const tableDataEntry = table_data.find((tableDataItem: any) => tableDataItem.id === table_data_id);

      if (!tableDataEntry) {
        return res.status(404).json({ message: 'Table data entry not found' });
      }

      // Find the table by table_id
      const table = tableDataEntry.tables.find((tableItem: any) => tableItem.id === table_id);
      console.log(user)

      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }

      // Push the current data into the orders array
      const orderEntry = {
        order_id: user.orders.length + 1,
        table_name,
        status,
        total_amt,
        order_type,
        items,
        payment_type,
        customer_info,
        created_at: new Date(),
      };

      if (!user.orders) {
        user.orders = [];
      }

      user.orders.push(orderEntry);

      // Reset table to default values
      table.status = 0;
      table.total_amt = 0;
      table.items = [];
      table.order_type = 1;

      // Update the database with the new orders array and reset table data
      await usersCollection.updateOne(
        { mobile },
        {
          $set: {
            "table_data.$[elem].tables.$[table].status": table.status,
            "table_data.$[elem].tables.$[table].total_amt": table.total_amt,
            "table_data.$[elem].tables.$[table].order_type": table.order_type,
            "table_data.$[elem].tables.$[table].items": table.items,
            orders: user.orders,
          },
        },
        {
          arrayFilters: [
            { "elem.id": table_data_id },
            { "table.id": table_id },
          ],
        }
      );

      // Return the updated table data
      return res.status(200).json({
        message: 'Order saved and table reset to default values',
        order: orderEntry,
      });
    } catch (err) {
      console.error('Error:', err); // Log the error for debugging
      res.status(500).json({ message: 'Error saving e-bill and resetting table', error: err });
    }
  });

  router.post('/orders', async (req: any, res: any) => {
    try {
      const { mobile, search, startDate, endDate, limit = 5, offset = 0 } = req.body;
      console.log("Mobile:", mobile);

      if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
      }

      // Find user by mobile number
      const user = await usersCollection.findOne({ mobile });
      console.log("User:", user);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let orders = user.orders || [];

      // Sort orders by created_at in descending order to get the latest first
      orders.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply search filter (case-insensitive match on item names)
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        orders = orders.filter((order: { items: any[] }) =>
          order.items.some((item: { value: string }) => searchRegex.test(item.value))
        );
      }

      // Apply date filter (startDate & endDate)
      if (startDate || endDate) {
        // Parse startDate and endDate as Date objects
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();

        // Adjust end date to include the entire day
        end.setHours(23, 59, 59, 999);

        orders = orders.filter((order: { created_at: string | number | Date }) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= start && orderDate <= end;
        });
      }

      // Pagination: Apply limit and offset
      const totalAmt = orders.reduce((total: number, order: any) => total + order.total_amt, 0)
      const totalItems = orders.length;  // Total number of items after filtering
      const totalPages = Math.ceil(totalItems / limit);  // Total pages available
      const paginatedOrders = orders.slice(offset, offset + limit); // Slice the orders array based on limit and offset

      return res.status(200).json({ orders: paginatedOrders, totalItems, totalPages, totalAmt });
    } catch (err) {
      console.error('Error fetching filtered orders:', err);
      res.status(500).json({ message: 'Error fetching filtered orders', error: err });
    }
  });

  return router;
};
