using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using TreeApi.Models;
using TreeApi.Services;

namespace TreeApi.Tests
{
	public class TestTreeDbContextProvider : ITreeDbContextProvider
	{
		private readonly string _databaseName;

		public TestTreeDbContextProvider(string databaseName)
		{
			_databaseName = databaseName;
		}

		public TreeDbContext CreateContext()
		{
			var options = new DbContextOptionsBuilder<TreeDbContext>()
				.UseInMemoryDatabase(databaseName: _databaseName)
				.Options;

			return new TreeDbContext(options);
		}
	}
}
