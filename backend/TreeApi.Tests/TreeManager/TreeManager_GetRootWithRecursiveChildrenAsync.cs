using System;
using System.Threading.Tasks;
using TreeApi.Models;
using Xunit;
using FluentAssertions;
using TreeApi.Services;

namespace TreeApi.Tests
{
	public class TreeManager_GetRootWithRecursiveChildrenAsync_Should
	{
		[Fact]
		public async Task ReturnSingleRoot()
		{
			var provider = new TestTreeDbContextProvider(nameof(ReturnSingleRoot));

			using (var context = provider.CreateContext())
			{
				await context.Nodes.AddAsync(new Node
				{
					Id = 1,
					Name = "Root"
				});
				await context.SaveChangesAsync();
			}

			var manager = new TreeManager(provider);
			var root = await manager.GetRootWithRecursiveChildrenAsync();
			root.Should().BeEquivalentTo(new Node
			{
				Id = 1,
				Name = "Root"
			});
		}

		[Fact]
		public async Task ReturnNullIfRootDoesNotExist()
		{
			var provider = new TestTreeDbContextProvider(nameof(ReturnNullIfRootDoesNotExist));

			var manager = new TreeManager(provider);
			var root = await manager.GetRootWithRecursiveChildrenAsync();
			root.Should().BeNull();
		}

		[Fact]
		public async Task ThrowIfMoreThanOneRoot()
		{
			var provider = new TestTreeDbContextProvider(nameof(ThrowIfMoreThanOneRoot));

			using (var context = provider.CreateContext())
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

			var manager = new TreeManager(provider);
			Func<Task> action = async () => await manager.GetRootWithRecursiveChildrenAsync();
			await action.Should().ThrowAsync<InvalidOperationException>("Sequence contains more than one matching element");
		}
	}
}
