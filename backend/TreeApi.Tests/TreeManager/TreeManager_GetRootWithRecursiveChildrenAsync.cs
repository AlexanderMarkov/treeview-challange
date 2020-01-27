using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using TreeApi.Models;
using Xunit;
using FluentAssertions;
using TreeApi.Services;
using System.Collections.Generic;

namespace TreeApi.Tests
{
	public class TreeManager_GetRootWithRecursiveChildrenAsync_Should
	{
		[Fact]
		public async Task ReturnSingleRoot()
		{
			var options = new DbContextOptionsBuilder<TreeDbContext>()
				.UseInMemoryDatabase(databaseName: nameof(ReturnSingleRoot))
				.Options;

			using (var context = new TreeDbContext(options))
			{
				await context.Nodes.AddAsync(new Node
				{
					Id = 1,
					Name = "Root"
				});
				await context.SaveChangesAsync();
			}

			using (var context = new TreeDbContext(options))
			{
				var manager = new TreeManager(context);
				var root = await manager.GetRootWithRecursiveChildrenAsync();
				root.Should().BeEquivalentTo(new Node
				{
					Id = 1,
					Name = "Root"
				});
			}
		}

		[Fact]
		public async Task ReturnNullIfRootDoesNotExist()
		{
			var options = new DbContextOptionsBuilder<TreeDbContext>()
				.UseInMemoryDatabase(databaseName: nameof(ReturnNullIfRootDoesNotExist))
				.Options;

			using (var context = new TreeDbContext(options))
			{
				var manager = new TreeManager(context);
				var root = await manager.GetRootWithRecursiveChildrenAsync();
				root.Should().BeNull();
			}
		}

		[Fact]
		public async Task ThrowIfMoreThanOneRoot()
		{
			var options = new DbContextOptionsBuilder<TreeDbContext>()
				.UseInMemoryDatabase(databaseName: nameof(ReturnSingleRoot))
				.Options;

			using (var context = new TreeDbContext(options))
			{
				await context.Nodes.AddRangeAsync(
					new Node
					{
						Id = 1,
						Name = "Root 1"
					},
					new Node
					{
						Id = 2,
						Name = "Root 2"
					}
				);
				await context.SaveChangesAsync();
			}

			using (var context = new TreeDbContext(options))
			{
				var manager = new TreeManager(context);
				Func<Task> action = async () => await manager.GetRootWithRecursiveChildrenAsync();
				await action.Should().ThrowAsync<InvalidOperationException>("Sequence contains more than one matching element");
			}
		}
	}
}
